using Grpc.Core;
using ChoferService.Proto;
using ChoferService.Data;
using ChoferService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Google.Protobuf.WellKnownTypes;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Npgsql;

namespace ChoferService.Services;

public class DriversGrpc : DriversService.DriversServiceBase
{
    private readonly DriversDb _context;
    private readonly ILogger<DriversGrpc> _logger;

    public DriversGrpc(DriversDb context, ILogger<DriversGrpc> logger)
    {
        _context = context;
        _logger = logger;
    }

    [Authorize(Policy = "DriversCreate")]
    public override async Task<DriverResponse> CreateDriver(CreateDriverRequest request, ServerCallContext context)
    {
        try
        {
            _logger.LogInformation("CreateDriver called with UserId: {UserId}", request.UserId);
            
            // Validar user_id como Guid
            if (!Guid.TryParse(request.UserId, out var userId))
            {
                _logger.LogWarning("Invalid user_id format: {UserId}", request.UserId);
                throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid user_id format"));
            }

            // Validar capabilities
            if (request.Capabilities < 1 || request.Capabilities > 3)
            {
                throw new RpcException(new Status(StatusCode.InvalidArgument, "Capabilities must be 1, 2, or 3"));
            }

            // Validar license_number no vacío
            if (string.IsNullOrWhiteSpace(request.LicenseNumber))
            {
                throw new RpcException(new Status(StatusCode.InvalidArgument, "License number is required"));
            }

            // Normalizar availability
            var availability = request.Availability == 0 ? 1 : request.Availability;
            if (availability < 1 || availability > 3)
            {
                throw new RpcException(new Status(StatusCode.InvalidArgument, "Availability must be 1, 2, or 3"));
            }

            var driver = new Models.Driver
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                FullName = request.FullName,
                LicenseNumber = request.LicenseNumber,
                Capabilities = (short)request.Capabilities,
                Availability = (short)availability,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _logger.LogInformation("Adding driver to context");
            _context.Drivers.Add(driver);
            
            _logger.LogInformation("Saving changes to database");
            await _context.SaveChangesAsync();

            _logger.LogInformation("Driver created successfully with ID {DriverId} for user {UserId}", driver.Id, driver.UserId);

            return new DriverResponse
            {
                Driver = MapToProtoDriver(driver)
            };
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            throw new RpcException(new Status(StatusCode.AlreadyExists, "LICENSE_OR_USER_DUP"));
        }
        catch (RpcException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating driver for user {UserId}: {Message}", request.UserId, ex.Message);
            throw new RpcException(new Status(StatusCode.Internal, $"Internal server error: {ex.Message}"));
        }
    }

    [Authorize]
    public override async Task<DriverResponse> GetDriver(GetDriverRequest request, ServerCallContext context)
    {
        try
        {
            if (!Guid.TryParse(request.Id, out var driverId))
            {
                throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid driver ID format"));
            }

            var driver = await _context.Drivers
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == driverId);

            if (driver == null)
            {
                throw new RpcException(new Status(StatusCode.NotFound, "Driver not found"));
            }

            return new DriverResponse
            {
                Driver = MapToProtoDriver(driver)
            };
        }
        catch (RpcException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting driver {DriverId}", request.Id);
            throw new RpcException(new Status(StatusCode.Internal, "Internal server error"));
        }
    }

    [Authorize]
    public override async Task<DriverResponse> GetDriverByUserId(GetDriverByUserIdRequest request, ServerCallContext context)
    {
        try
        {
            if (!Guid.TryParse(request.UserId, out var userId))
            {
                throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid user ID format"));
            }

            var driver = await _context.Drivers
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (driver == null)
            {
                throw new RpcException(new Status(StatusCode.NotFound, "DRIVER_NOT_FOUND"));
            }

            return new DriverResponse
            {
                Driver = MapToProtoDriver(driver)
            };
        }
        catch (RpcException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting driver by user ID {UserId}", request.UserId);
            throw new RpcException(new Status(StatusCode.Internal, $"Database error: {ex.Message}"));
        }
    }

    [Authorize(Policy = "DriversReadAll")]
    public override async Task<ListDriversResponse> ListDrivers(ListDriversRequest request, ServerCallContext context)
    {
        try
        {
            // Normalizar paginación
            var page = request.Page <= 0 ? 1 : request.Page;
            var size = request.PageSize <= 0 ? 20 : Math.Min(request.PageSize, 100);

            var query = _context.Drivers.AsNoTracking();

            // Filtrar por availability si se proporciona
            if (request.Availability != 0)
            {
                var availability = request.Availability;
                if (availability < 1 || availability > 3)
                {
                    throw new RpcException(new Status(StatusCode.InvalidArgument, "Availability must be 1, 2, or 3"));
                }
                query = query.Where(d => d.Availability == availability);
            }

            // Contar total
            var totalCount = await query.CountAsync();

            // Aplicar paginación y ordenamiento
            var drivers = await query
                .OrderBy(d => d.FullName)
                .Skip((page - 1) * size)
                .Take(size)
                .ToListAsync();

            var totalPages = (int)Math.Ceiling((double)totalCount / size);

            var response = new ListDriversResponse
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = size,
                TotalPages = totalPages
            };

            response.Drivers.AddRange(drivers.Select(MapToProtoDriver));

            return response;
        }
        catch (RpcException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing drivers");
            throw new RpcException(new Status(StatusCode.Internal, "Internal server error"));
        }
    }

    [Authorize]
    public override async Task<DriverResponse> UpdateAvailability(UpdateAvailabilityRequest request, ServerCallContext context)
    {
        try
        {
            if (!Guid.TryParse(request.Id, out var driverId))
            {
                throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid driver ID format"));
            }

            // Validar availability
            if (request.Availability < 1 || request.Availability > 3)
            {
                throw new RpcException(new Status(StatusCode.InvalidArgument, "Availability must be 1, 2, or 3"));
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.Id == driverId);

            if (driver == null)
            {
                throw new RpcException(new Status(StatusCode.NotFound, "Driver not found"));
            }

            // Autorizar "dueño o admin"
            var httpContext = context.GetHttpContext();
            var sub = httpContext.User.FindFirst("sub")?.Value;
            var isOwner = Guid.TryParse(sub, out var uid) && driver.UserId == uid;
            var canUpdateAny = httpContext.User.HasClaim("scope", "drivers:update:any");
            
            if (!isOwner && !canUpdateAny)
            {
                throw new RpcException(new Status(StatusCode.PermissionDenied, "FORBIDDEN"));
            }

            driver.Availability = (short)request.Availability;
            driver.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Driver {DriverId} availability updated to {Availability}", driverId, request.Availability);

            return new DriverResponse
            {
                Driver = MapToProtoDriver(driver)
            };
        }
        catch (RpcException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating driver availability {DriverId}", request.Id);
            throw new RpcException(new Status(StatusCode.Internal, "Internal server error"));
        }
    }

    [Authorize(Policy = "DriversReadOwn")]
    public override async Task<DriverResponse> GetMyDriver(Empty request, ServerCallContext context)
    {
        try
        {
            // Obtener el userId desde el token JWT
            var httpContext = context.GetHttpContext();
            var userIdClaim = httpContext.User.FindFirst("sub")?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                _logger.LogWarning("Invalid or missing user ID in token");
                throw new RpcException(new Status(StatusCode.Unauthenticated, "Invalid user token"));
            }

            _logger.LogInformation("GetMyDriver called for user {UserId}", userId);

            var driver = await _context.Drivers
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (driver == null)
            {
                _logger.LogWarning("Driver not found for user {UserId}", userId);
                throw new RpcException(new Status(StatusCode.NotFound, "DRIVER_NOT_FOUND"));
            }

            _logger.LogInformation("Driver found for user {UserId}: {DriverId}", userId, driver.Id);

            return new DriverResponse
            {
                Driver = MapToProtoDriver(driver)
            };
        }
        catch (RpcException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting my driver: {Message}", ex.Message);
            throw new RpcException(new Status(StatusCode.Internal, $"Internal server error: {ex.Message}"));
        }
    }

    private static ChoferService.Proto.Driver MapToProtoDriver(Models.Driver driver)
    {
        return new ChoferService.Proto.Driver
        {
            Id = driver.Id.ToString(),
            UserId = driver.UserId.ToString(),
            FullName = driver.FullName,
            LicenseNumber = driver.LicenseNumber,
            Capabilities = driver.Capabilities,
            Availability = driver.Availability,
            CreatedAt = Timestamp.FromDateTimeOffset(driver.CreatedAt),
            UpdatedAt = Timestamp.FromDateTimeOffset(driver.UpdatedAt)
        };
    }
}
