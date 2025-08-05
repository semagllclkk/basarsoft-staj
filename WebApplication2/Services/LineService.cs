using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using WebApplication2.Dtos;
using WebApplication2.Models;
using WebApplication2.Repositories;
using WebApplication2.Resources;
using WebApplication2.Responces;
using WebApplication2.Validations;

namespace WebApplication2.Services
{
    public class LineService : ILineService
    {
        private readonly ILineRepository _lineRepository;
        private readonly IPointRepository _pointRepository;
        private readonly IPolygonRepository _polygonRepository;
        private readonly IUnitOfWork _unitOfWork;

        public LineService(
            ILineRepository lineRepository,
            IPointRepository pointRepository,
            IPolygonRepository polygonRepository,
            IUnitOfWork unitOfWork)
        {
            _lineRepository = lineRepository;
            _pointRepository = pointRepository;
            _polygonRepository = polygonRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<Response<LineA>> AddLineAsync(LineDTO dto)
        {
            try
            {
                if (!Validation.IsValidLineDTO(dto, out string message))
                {
                    return new Response<LineA>
                    {
                        success = false,
                        message = message,
                        data = null
                    };
                }

                var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                var wktReader = new WKTReader(geometryFactory);

                if (!(wktReader.Read(dto.WKT) is LineString lineGeometry))
                {
                    return new Response<LineA>
                    {
                        success = false,
                        message = Resource.InvalidLineFormat,
                        data = null
                    };
                }

                if (string.IsNullOrEmpty(dto.Type) || !new[] { "A", "B", "C" }.Contains(dto.Type))
                {
                    return new Response<LineA>
                    {
                        success = false,
                        message = "Geçerli bir tip seçiniz: A, B veya C",
                        data = null
                    };
                }

                var ruleValidation = await ValidateLineRules(lineGeometry, dto.Type);
                if (!ruleValidation.IsValid)
                {
                    return new Response<LineA>
                    {
                        success = false,
                        message = ruleValidation.ErrorMessage,
                        data = null
                    };
                }

                var line = new LineA
                {
                    Name = dto.Name,
                    WKT = dto.WKT,
                    Geometry = lineGeometry,
                    Type = dto.Type
                };

                await _lineRepository.AddLineAsync(line);
                await _unitOfWork.SaveChangesAsync();

                return new Response<LineA>
                {
                    success = true,
                    message = $"Tip {dto.Type} çizgi başarıyla eklendi.",
                    data = line
                };
            }
            catch (Exception ex)
            {
                return new Response<LineA>
                {
                    success = false,
                    message = $"Hata: {ex.Message}",
                    data = null
                };
            }
        }

        private async Task<(bool IsValid, string ErrorMessage)> ValidateLineRules(LineString lineGeometry, string type)
        {
            try
            {
                switch (type)
                {
                    case "A":
                        return await ValidateTypeALine(lineGeometry);
                    case "B":
                        return await ValidateTypeBLine(lineGeometry);
                    case "C":
                        return await ValidateTypeCLine(lineGeometry);
                    default:
                        return (false, "Geçersiz tip");
                }
            }
            catch (Exception ex)
            {
                return (false, $"Validasyon hatası: {ex.Message}");
            }
        }
        private async Task<(bool IsValid, string ErrorMessage)> ValidateTypeALine(LineString lineGeometry)
        {
            var allPolygons = await _polygonRepository.GetAllPolygonsAsync();
            var aTypePolygons = allPolygons.Where(p => p.Type == "A").ToList();

            if (!aTypePolygons.Any())
            {
                return (false, "A tipi çizgi çizmek için önce A tipi poligon çizmelisiniz.");
            }

            bool isInsideAnyAPolygon = false;
            foreach (var polygon in aTypePolygons)
            {
                if (polygon.Geometry != null && polygon.Geometry.Contains(lineGeometry))
                {
                    isInsideAnyAPolygon = true;
                    break;
                }
            }

            if (!isInsideAnyAPolygon)
            {
                return (false, "A tipi çizgi sadece A tipi poligonların içine çizilebilir.");
            }

            return (true, "");
        }
        private async Task<(bool IsValid, string ErrorMessage)> ValidateTypeBLine(LineString lineGeometry)
        {
            var coordinates = lineGeometry.Coordinates;
            var lineStartPoint = new Point(coordinates[0]);
            var lineEndPoint = new Point(coordinates[coordinates.Length - 1]);

            bool startPointValid = false;
            bool endPointValid = false;

            var aTypePoints = await _pointRepository.GetPointsByTypeAsync("A");
            foreach (var aPoint in aTypePoints)
            {
                if (aPoint.Geometry != null)
                {
                    if (aPoint.Geometry.Equals(lineStartPoint))
                    {
                        startPointValid = true;
                    }
                    if (aPoint.Geometry.Equals(lineEndPoint))
                    {
                        endPointValid = true;
                    }
                }
            }
            var aTypeLines = await _lineRepository.GetLinesByTypeAsync("A");
            foreach (var aLine in aTypeLines)
            {
                if (aLine.Geometry != null)
                {
                    var aCoordinates = aLine.Geometry.Coordinates;
                    var aStartPoint = new Point(aCoordinates[0]);
                    var aEndPoint = new Point(aCoordinates[aCoordinates.Length - 1]);

                    if (aStartPoint.Equals(lineStartPoint) || aEndPoint.Equals(lineStartPoint))
                    {
                        startPointValid = true;
                    }
                    if (aStartPoint.Equals(lineEndPoint) || aEndPoint.Equals(lineEndPoint))
                    {
                        endPointValid = true;
                    }
                }
            }

            if (!startPointValid && !endPointValid)
            {
                return (false, "B tipi çizgi başlangıç veya bitiş noktası A tipi objelerin başlangıç/bitiş noktalarından biri olmalıdır.");
            }

            return (true, "");
        }

        private async Task<(bool IsValid, string ErrorMessage)> ValidateTypeCLine(LineString lineGeometry)
        {
            var aTypePoints = await _pointRepository.GetPointsByTypeAsync("A");
            foreach (var aPoint in aTypePoints)
            {
                if (aPoint.Geometry != null && aPoint.Geometry.Intersects(lineGeometry))
                {
                    return (false, "C tipi çizgi A tipi objeler ile kesişemez.");
                }
            }

            var aTypeLines = await _lineRepository.GetLinesByTypeAsync("A");
            foreach (var aLine in aTypeLines)
            {
                if (aLine.Geometry != null && aLine.Geometry.Intersects(lineGeometry))
                {
                    return (false, "C tipi çizgi A tipi objeler ile kesişemez.");
                }
            }

            var bTypePoints = await _pointRepository.GetPointsByTypeAsync("B");
            var bTypeLines = await _lineRepository.GetLinesByTypeAsync("B");

            bool intersectsWithB = false;

            foreach (var bPoint in bTypePoints)
            {
                if (bPoint.Geometry != null && bPoint.Geometry.Intersects(lineGeometry))
                {
                    intersectsWithB = true;
                    break;
                }
            }

            if (!intersectsWithB)
            {
                foreach (var bLine in bTypeLines)
                {
                    if (bLine.Geometry != null && bLine.Geometry.Intersects(lineGeometry))
                    {
                        intersectsWithB = true;
                        break;
                    }
                }
            }

            if (!intersectsWithB)
            {
                return (false, "C tipi çizgi en az bir B tipi obje ile kesişmelidir.");
            }

            return (true, "");
        }

        public async Task<List<LineA>> GetAllLinesAsync()
        {
            return await _lineRepository.GetAllLinesAsync();
        }

        public async Task<Response<LineA>> GetLineByIdAsync(int id)
        {
            try
            {
                var line = await _lineRepository.GetLineByIdAsync(id);
                if (line == null)
                {
                    return new Response<LineA>
                    {
                        success = false,
                        message = Resource.LineNotFound,
                        data = null
                    };
                }

                return new Response<LineA>
                {
                    success = true,
                    message = Resource.LineFound,
                    data = line
                };
            }
            catch (Exception)
            {
                return new Response<LineA>
                {
                    success = false,
                    message = Resource.GenericError,
                    data = null
                };
            }
        }

        public async Task<Response<LineA>> UpdateLineAsync(int id, LineDTO dto)
        {
            try
            {
                var existingLine = await _lineRepository.GetLineByIdAsync(id);
                if (existingLine == null)
                {
                    return new Response<LineA>
                    {
                        success = false,
                        message = Resource.LineNotFoundForUpdate,
                        data = null
                    };
                }

                if (!Validation.IsValidLineDTO(dto, out string message))
                {
                    return new Response<LineA>
                    {
                        success = false,
                        message = message,
                        data = null
                    };
                }

                var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                var wktReader = new WKTReader(geometryFactory);
                var geometry = wktReader.Read(dto.WKT) as LineString;

                var ruleValidation = await ValidateLineRules(geometry, dto.Type);
                if (!ruleValidation.IsValid)
                {
                    return new Response<LineA>
                    {
                        success = false,
                        message = ruleValidation.ErrorMessage,
                        data = null
                    };
                }

                existingLine.Name = dto.Name;
                existingLine.WKT = dto.WKT;
                existingLine.Geometry = geometry;
                existingLine.Type = dto.Type;

                await _lineRepository.UpdateLineAsync(existingLine);
                await _unitOfWork.SaveChangesAsync();

                return new Response<LineA>
                {
                    success = true,
                    message = Resource.LineUpdated,
                    data = existingLine
                };
            }
            catch (Exception)
            {
                return new Response<LineA>
                {
                    success = false,
                    message = "Genel hata",
                    data = null
                };
            }
        }

        public async Task<Response<LineA>> DeleteLineAsync(int id)
        {
            try
            {
                var line = await _lineRepository.GetLineByIdAsync(id);
                if (line == null)
                {
                    return new Response<LineA>
                    {
                        success = false,
                        message = Resource.LineNotFoundForDelete,
                        data = null
                    };
                }

                bool deleted = await _lineRepository.DeleteLineAsync(id);
                if (!deleted)
                {
                    return new Response<LineA>
                    {
                        success = false,
                        message = Resource.LineCouldNotBeDeleted,
                        data = null
                    };
                }

                await _unitOfWork.SaveChangesAsync();

                return new Response<LineA>
                {
                    success = true,
                    message = Resource.LineDeleted,
                    data = line
                };
            }
            catch (Exception)
            {
                return new Response<LineA>
                {
                    success = false,
                    message = Resource.GenericError,
                    data = null
                };
            }
        }
    }
}