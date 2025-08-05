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
    public class PointService : IPointService
    {
        private readonly IPointRepository _pointRepository;
        private readonly ILineRepository _lineRepository;
        private readonly IPolygonRepository _polygonRepository;
        private readonly IUnitOfWork _unitOfWork;

        public PointService(
            IPointRepository pointRepository,
            ILineRepository lineRepository,
            IPolygonRepository polygonRepository,
            IUnitOfWork unitOfWork)
        {
            _pointRepository = pointRepository;
            _lineRepository = lineRepository;
            _polygonRepository = polygonRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<Response<PointA>> AddPointAsync(PointDTO dto)
        {
            try
            {
                if (!Validation.IsValidPointDTO(dto, out string message))
                {
                    return new Response<PointA>
                    {
                        success = false,
                        message = message,
                        data = null
                    };
                }

                var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                var wktReader = new WKTReader(geometryFactory);

                if (!(wktReader.Read(dto.WKT) is Point pointGeometry))
                {
                    return new Response<PointA>
                    {
                        success = false,
                        message = "Geçersiz nokta geometrisi",
                        data = null
                    };
                }

                if (string.IsNullOrEmpty(dto.Type) || !new[] { "A", "B", "C" }.Contains(dto.Type))
                {
                    return new Response<PointA>
                    {
                        success = false,
                        message = "Geçerli bir tip seçiniz: A, B veya C",
                        data = null
                    };
                }

                var ruleValidation = await ValidatePointRules(pointGeometry, dto.Type);
                if (!ruleValidation.IsValid)
                {
                    return new Response<PointA>
                    {
                        success = false,
                        message = ruleValidation.ErrorMessage,
                        data = null
                    };
                }

                var point = new PointA
                {
                    Name = dto.Name,
                    WKT = dto.WKT,
                    Geometry = pointGeometry,
                    Type = dto.Type
                };

                await _pointRepository.AddPointAsync(point);
                await _unitOfWork.SaveChangesAsync();

                return new Response<PointA>
                {
                    success = true,
                    message = $"Tip {dto.Type} nokta başarıyla eklendi.",
                    data = point
                };
            }
            catch (Exception ex)
            {
                return new Response<PointA>
                {
                    success = false,
                    message = $"Hata: {ex.Message}",
                    data = null
                };
            }
        }

        private async Task<(bool IsValid, string ErrorMessage)> ValidatePointRules(Point pointGeometry, string type)
        {
            try
            {
                switch (type)
                {
                    case "A":
                        return await ValidateTypeAPoint(pointGeometry);
                    case "B":
                        return await ValidateTypeBPoint(pointGeometry);
                    case "C":
                        return await ValidateTypeCPoint(pointGeometry);
                    default:
                        return (false, "Geçersiz tip");
                }
            }
            catch (Exception ex)
            {
                return (false, $"Validasyon hatası: {ex.Message}");
            }
        }
        private async Task<(bool IsValid, string ErrorMessage)> ValidateTypeAPoint(Point pointGeometry)
        {
            var allPolygons = await _polygonRepository.GetAllPolygonsAsync();
            var aTypePolygons = allPolygons.Where(p => p.Type == "A").ToList();

            if (!aTypePolygons.Any())
            {
                return (false, "A tipi nokta çizmek için önce A tipi poligon çizmelisiniz.");
            }

            bool isInsideAnyAPolygon = false;
            foreach (var polygon in aTypePolygons)
            {
                if (polygon.Geometry != null && polygon.Geometry.Contains(pointGeometry))
                {
                    isInsideAnyAPolygon = true;
                    break;
                }
            }

            if (!isInsideAnyAPolygon)
            {
                return (false, "A tipi nokta sadece A tipi poligonların içine çizilebilir.");
            }

            return (true, string.Empty);
        }

        private async Task<(bool IsValid, string ErrorMessage)> ValidateTypeBPoint(Point pointGeometry)
        {
            var aTypePoints = await _pointRepository.GetPointsByTypeAsync("A");
            foreach (var aPoint in aTypePoints)
            {
                if (aPoint.Geometry != null && aPoint.Geometry.Equals(pointGeometry))
                {
                    return (true, string.Empty);
                }
            }

            var aTypeLines = await _lineRepository.GetLinesByTypeAsync("A");
            foreach (var aLine in aTypeLines)
            {
                if (aLine.Geometry != null)
                {
                    var coordinates = aLine.Geometry.Coordinates;
                    var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                    var startPoint = geometryFactory.CreatePoint(coordinates[0]);
                    var endPoint = geometryFactory.CreatePoint(coordinates[coordinates.Length - 1]);

                    if (startPoint.Equals(pointGeometry) || endPoint.Equals(pointGeometry))
                    {
                        return (true, string.Empty);
                    }
                }
            }

            return (false, "B tipi nokta sadece A tipi objelerin başlangıç/bitiş noktalarına çizilebilir.");
        }

        private async Task<(bool IsValid, string ErrorMessage)> ValidateTypeCPoint(Point pointGeometry)
        {
            var aTypePoints = await _pointRepository.GetPointsByTypeAsync("A");
            foreach (var aPoint in aTypePoints)
            {
                if (aPoint.Geometry != null && aPoint.Geometry.Intersects(pointGeometry))
                {
                    return (false, "C tipi nokta A tipi objeler ile kesişemez.");
                }
            }

            var aTypeLines = await _lineRepository.GetLinesByTypeAsync("A");
            foreach (var aLine in aTypeLines)
            {
                if (aLine.Geometry != null && aLine.Geometry.Intersects(pointGeometry))
                {
                    return (false, "C tipi nokta A tipi objeler ile kesişemez.");
                }
            }
            var bTypePoints = await _pointRepository.GetPointsByTypeAsync("B");
            var bTypeLines = await _lineRepository.GetLinesByTypeAsync("B");

            bool intersectsWithB = false;

            foreach (var bPoint in bTypePoints)
            {
                if (bPoint.Geometry != null && bPoint.Geometry.Intersects(pointGeometry))
                {
                    intersectsWithB = true;
                    break;
                }
            }

            if (!intersectsWithB)
            {
                foreach (var bLine in bTypeLines)
                {
                    if (bLine.Geometry != null && bLine.Geometry.Intersects(pointGeometry))
                    {
                        intersectsWithB = true;
                        break;
                    }
                }
            }

            if (!intersectsWithB)
            {
                return (false, "C tipi nokta en az bir B tipi obje ile kesişmelidir.");
            }

            return (true, string.Empty);
        }

        public async Task<List<PointA>> GetAllPointsAsync()
        {
            return await _pointRepository.GetAllPointsAsync();
        }

        public async Task<Response<PointA>> GetPointByIdAsync(int id)
        {
            try
            {
                var point = await _pointRepository.GetPointByIdAsync(id);
                if (point == null)
                {
                    return new Response<PointA>
                    {
                        success = false,
                        message = Resource.PointNotFound,
                        data = null
                    };
                }

                return new Response<PointA>
                {
                    success = true,
                    message = Resource.PointFound,
                    data = point
                };
            }
            catch (Exception ex)
            {
                return new Response<PointA>
                {
                    success = false,
                    message = $"Hata: {ex.Message}",
                    data = null
                };
            }
        }

        public async Task<Response<PointA>> UpdatePointAsync(int id, PointDTO dto)
        {
            try
            {
                var existingPoint = await _pointRepository.GetPointByIdAsync(id);
                if (existingPoint == null)
                {
                    return new Response<PointA>
                    {
                        success = false,
                        message = Resource.PolygonNotFoundForUpdate,
                        data = null
                    };
                }

                if (!Validation.IsValidPointDTO(dto, out string message))
                {
                    return new Response<PointA>
                    {
                        success = false,
                        message = message,
                        data = null
                    };
                }

                var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                var wktReader = new WKTReader(geometryFactory);
                var geometry = wktReader.Read(dto.WKT) as Point;

                if (geometry == null)
                {
                    return new Response<PointA>
                    {
                        success = false,
                        message = "Geçersiz geometri",
                        data = null
                    };
                }

                var ruleValidation = await ValidatePointRules(geometry, dto.Type);
                if (!ruleValidation.IsValid)
                {
                    return new Response<PointA>
                    {
                        success = false,
                        message = ruleValidation.ErrorMessage,
                        data = null
                    };
                }

                existingPoint.Name = dto.Name;
                existingPoint.WKT = dto.WKT;
                existingPoint.Geometry = geometry;
                existingPoint.Type = dto.Type;

                await _pointRepository.UpdatePointAsync(existingPoint);
                await _unitOfWork.SaveChangesAsync();

                return new Response<PointA>
                {
                    success = true,
                    message = Resource.PointUpdated,
                    data = existingPoint
                };
            }
            catch (Exception ex)
            {
                return new Response<PointA>
                {
                    success = false,
                    message = $"Hata: {ex.Message}",
                    data = null
                };
            }
        }

        public async Task<Response<PointA>> DeletePointAsync(int id)
        {
            try
            {
                var point = await _pointRepository.GetPointByIdAsync(id);
                if (point == null)
                {
                    return new Response<PointA>
                    {
                        success = false,
                        message = Resource.PointNotFoundForDelete,
                        data = null
                    };
                }

                bool deleted = await _pointRepository.DeletePointAsync(id);
                if (!deleted)
                {
                    return new Response<PointA>
                    {
                        success = false,
                        message = Resource.PolygonCouldNotBeDeleted,
                        data = null
                    };
                }

                await _unitOfWork.SaveChangesAsync();

                return new Response<PointA>
                {
                    success = true,
                    message = Resource.PointDeleted,
                    data = point
                };
            }
            catch (Exception ex)
            {
                return new Response<PointA>
                {
                    success = false,
                    message = $"Hata: {ex.Message}",
                    data = null
                };
            }
        }
        public async Task<Response<List<PointA>>> SearchPointsByNameAsync(string name)
        {
            try
            {
                var points = await _pointRepository.GetByNameAsync(name);
                return new Response<List<PointA>>
                {
                    success = true,
                    message = $"{points.Count} nokta bulundu",
                    data = points
                };
            }
            catch (Exception ex)
            {
                return new Response<List<PointA>>
                {
                    success = false,
                    message = $"Arama hatası: {ex.Message}",
                    data = null
                };
            }
        }
    }
}