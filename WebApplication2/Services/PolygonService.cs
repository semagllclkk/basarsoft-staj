using Microsoft.EntityFrameworkCore.Diagnostics;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using WebApplication2.Dtos;
using WebApplication2.Models;
using WebApplication2.Repositories;
using WebApplication2.Resources;
using WebApplication2.Responces;
using WebApplication2.Validations;
using System.Linq;

namespace WebApplication2.Services
{
    public class PolygonService : IPolygonService
    {
        private readonly IPolygonRepository _repository;
        private readonly IUnitOfWork _unitOfWork;

        public PolygonService(IPolygonRepository repository, IUnitOfWork unitOfWork)
        {
            _repository = repository;
            _unitOfWork = unitOfWork;
        }

        public async Task<Response<PolygonA>> AddPolygonAsync(PolygonDTO dto)
        {
            try
            {
                
                if (!Validation.IsValidPolygonDTO(dto, out string message))
                {
                    return new Response<PolygonA>
                    {
                        success = false,
                        message = message,
                        data = null
                    };
                }

                var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                var wktReader = new WKTReader(geometryFactory);

                if (!(wktReader.Read(dto.WKT) is Polygon originalGeometry))
                {
                    return new Response<PolygonA>
                    {
                        success = false,
                        message = Resource.InvalidPolygonFormat,
                        data = null
                    };
                }

                var cleanedGeometry = Validation.CleanGeometry(originalGeometry);
                if (cleanedGeometry == null || cleanedGeometry.IsEmpty)
                {
                    return new Response<PolygonA>
                    {
                        success = false,
                        message = Resource.InvalidCoordinates,
                        data = null
                    };
                }

                var existingPolygons = await _repository.GetAllPolygonsAsync();
                var finalGeometry = cleanedGeometry;
                var intersectionMessages = new List<string>();

                foreach (var existing in existingPolygons)
                {
                    try
                    {
                        if (existing.Geometry != null && finalGeometry.Intersects(existing.Geometry))
                        {
                            var intersection = finalGeometry.Intersection(existing.Geometry);

                            if (!intersection.IsEmpty && intersection.Area > 0.000001) // Çok küçük alanları ihmal et
                            {
                                intersectionMessages.Add($"'{existing.Name}' poligonu ile kesişim var (Alan: {intersection.Area:F6})");

                                var difference = finalGeometry.Difference(existing.Geometry);

                                if (difference == null || difference.IsEmpty)
                                {
                                    return new Response<PolygonA>
                                    {
                                        success = false,
                                        message = $"Poligon tamamen '{existing.Name}' alanıyla çakışıyor, kayıt yapılmadı.",
                                        data = null
                                    };
                                }

                                finalGeometry = ProcessDifferenceResult(difference);

                                if (finalGeometry == null || finalGeometry.IsEmpty)
                                {
                                    return new Response<PolygonA>
                                    {
                                        success = false,
                                        message = "Intersection işlemi sonucunda geçerli poligon kalmadı.",
                                        data = null
                                    };
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Intersection hatası polygon {existing.Id}: {ex.Message}");
                        continue;
                    }
                }

                if (finalGeometry == null || finalGeometry.IsEmpty || finalGeometry.Area < 0.000001)
                {
                    return new Response<PolygonA>
                    {
                        success = false,
                        message = "Intersection işlemleri sonucunda geçerli bir alan kalmadı.",
                        data = null
                    };
                }

                finalGeometry = CleanFinalGeometry(finalGeometry);

                if (finalGeometry == null || finalGeometry.IsEmpty)
                {
                    return new Response<PolygonA>
                    {
                        success = false,
                        message = "Son temizleme işlemi sonucunda geçerli geometri kalmadı.",
                        data = null
                    };
                }

                var wktWriter = new WKTWriter();
                var newWKT = wktWriter.Write(finalGeometry);

                var polygon = new PolygonA
                {
                    Name = dto.Name,
                    WKT = newWKT,
                    Geometry = finalGeometry
                };

                await _repository.AddPolygonAsync(polygon);
                await _unitOfWork.SaveChangesAsync();

                var successMessage = Resource.PolygonAdded;
                if (intersectionMessages.Any())
                {
                    successMessage += $" Uyarı: {string.Join(", ", intersectionMessages)}";
                }

                return new Response<PolygonA>
                {
                    success = true,
                    message = successMessage,
                    data = polygon
                };
            }
            catch (Exception ex)
            {
                return new Response<PolygonA>
                {
                    success = false,
                    message = $"{Resource.GenericError} Detay: {ex.Message}",
                    data = null
                };
            }
        }

        private Polygon ProcessDifferenceResult(Geometry difference)
        {
            try
            {
                if (difference is Polygon singlePolygon)
                {
                    return singlePolygon;
                }
                else if (difference is MultiPolygon multiPolygon)
                {
                    var largestPolygon = multiPolygon.Geometries
                        .Cast<Polygon>()
                        .Where(p => p != null && !p.IsEmpty && p.Area > 0.000001)
                        .OrderByDescending(p => p.Area)
                        .FirstOrDefault();

                    return largestPolygon;
                }
                else if (difference is GeometryCollection geometryCollection)
                {
                    var polygons = geometryCollection.Geometries
                        .OfType<Polygon>()
                        .Where(p => p != null && !p.IsEmpty && p.Area > 0.000001)
                        .OrderByDescending(p => p.Area)
                        .FirstOrDefault();

                    return polygons;
                }

                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ProcessDifferenceResult hatası: {ex.Message}");
                return null;
            }
        }

      
        private Polygon CleanFinalGeometry(Polygon geometry)
        {
            try
            {
                if (geometry == null || geometry.IsEmpty)
                    return null;

                var buffered = geometry.Buffer(0);

                if (buffered is Polygon cleanPolygon)
                {
                    return cleanPolygon.IsValid ? cleanPolygon : null;
                }
                else if (buffered is MultiPolygon multiPoly)
                {
                    var largest = multiPoly.Geometries
                        .Cast<Polygon>()
                        .Where(p => p.IsValid && !p.IsEmpty)
                        .OrderByDescending(p => p.Area)
                        .FirstOrDefault();

                    return largest;
                }

                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CleanFinalGeometry hatası: {ex.Message}");
                return geometry.IsValid ? geometry : null;
            }
        }
        public async Task<Response<IntersectionResult>> CheckIntersectionAsync(string wkt)
        {
            try
            {
                var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                var wktReader = new WKTReader(geometryFactory);

                if (!(wktReader.Read(wkt) is Polygon inputGeometry))
                {
                    return new Response<IntersectionResult>
                    {
                        success = false,
                        message = Resource.InvalidPolygonFormat,
                        data = null
                    };
                }

                var existingPolygons = await _repository.GetAllPolygonsAsync();
                var intersectingPolygons = new List<object>();
                var hasIntersection = false;

                foreach (var existing in existingPolygons)
                {
                    try
                    {
                        if (existing.Geometry != null && inputGeometry.Intersects(existing.Geometry))
                        {
                            var intersection = inputGeometry.Intersection(existing.Geometry);

                            if (!intersection.IsEmpty && intersection.Area > 0.000001)
                            {
                                hasIntersection = true;
                                intersectingPolygons.Add(new
                                {
                                    Id = existing.Id,
                                    Name = existing.Name,
                                    IntersectionArea = intersection.Area
                                });
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Intersection check hatası polygon {existing.Id}: {ex.Message}");
                        continue;
                    }
                }

                return new Response<IntersectionResult>
                {
                    success = true,
                    message = Resource.IntersectionControlCompleted,
                    data = new IntersectionResult
                    {
                        HasIntersection = hasIntersection,
                        IntersectingCount = intersectingPolygons.Count,
                        IntersectingPolygons = intersectingPolygons
                    }
                };
            }
            catch (Exception ex)
            {
                return new Response<IntersectionResult>
                {
                    success = false,
                    message = $"Intersection kontrolü hatası: {ex.Message}",
                    data = null
                };
            }
        }

        public async Task<Response<PolygonA>> GetPolygonByIdAsync(int id)
        {
            try
            {
                var polygon = await _repository.GetPolygonByIdAsync(id);
                if (polygon == null)
                {
                    return new Response<PolygonA>
                    {
                        success = false,
                        message = Resource.PolygonNotFound,
                        data = null
                    };
                }

                return new Response<PolygonA>
                {
                    success = true,
                    message = Resource.PolygonFound,
                    data = polygon
                };
            }
            catch (Exception)
            {
                return new Response<PolygonA>
                {
                    success = false,
                    message = Resource.GenericError,
                    data = null
                };
            }
        }

        public async Task<List<PolygonA>> GetAllPolygonsAsync()
        {
            return await _repository.GetAllPolygonsAsync();
        }

        public async Task<Response<PolygonA>> UpdatePolygonAsync(int id, PolygonDTO dto)
        {
            try
            {
                var existingPolygon = await _repository.GetPolygonByIdAsync(id);
                if (existingPolygon == null)
                {
                    return new Response<PolygonA>
                    {
                        success = false,
                        message = Resource.PolygonNotFoundForUpdate,
                        data = null
                    };
                }

                if (!Validation.IsValidPolygonDTO(dto, out string message))
                {
                    return new Response<PolygonA>
                    {
                        success = false,
                        message = message,
                        data = null
                    };
                }

                var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                var wktReader = new WKTReader(geometryFactory);
                var geometry = wktReader.Read(dto.WKT) as Polygon;

                geometry = Validation.CleanGeometry(geometry);
                if (geometry == null)
                {
                    return new Response<PolygonA>
                    {
                        success = false,
                        message = Resource.InvalidCoordinates,
                        data = null
                    };
                }

                existingPolygon.Name = dto.Name;
                existingPolygon.WKT = dto.WKT;
                existingPolygon.Geometry = geometry;

                await _repository.UpdatePolygonAsync(existingPolygon);
                await _unitOfWork.SaveChangesAsync();

                return new Response<PolygonA>
                {
                    success = true,
                    message = Resource.PolygonUpdated,
                    data = existingPolygon
                };
            }
            catch (Exception)
            {
                return new Response<PolygonA>
                {
                    success = false,
                    message = Resource.GenericError,
                    data = null
                };
            }
        }

        public async Task<Response<PolygonA>> DeletePolygonAsync(int id)
        {
            try
            {
                var polygon = await _repository.GetPolygonByIdAsync(id);
                if (polygon == null)
                {
                    return new Response<PolygonA>
                    {
                        success = false,
                        message = Resource.PolygonNotFoundForDelete,
                        data = null
                    };
                }

                bool deleted = await _repository.DeletePolygonAsync(id);
                if (!deleted)
                {
                    return new Response<PolygonA>
                    {
                        success = false,
                        message = Resource.PolygonCouldNotBeDeleted,
                        data = null
                    };
                }

                await _unitOfWork.SaveChangesAsync();

                return new Response<PolygonA>
                {
                    success = true,
                    message = Resource.PolygonDeleted,
                    data = polygon
                };
            }
            catch (Exception)
            {
                return new Response<PolygonA>
                {
                    success = false,
                    message = Resource.GenericError,
                    data = null
                };
            }
        }
    }
}