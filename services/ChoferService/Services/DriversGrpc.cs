using Grpc.Core;
using ChoferService.Proto;
using ChoferService.Data;
using ChoferService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Google.Protobuf.WellKnownTypes;

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
            // Validar user_id como Guid
            if (!Guid.TryParse(request.UserId, out var userId))
            {
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

            var driver = new Models.Driver
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                FullName = request.FullName,
                LicenseNumber = request.LicenseNumber,
                Capabilities = (short)request.Capabilities,
                Availability = 1, // Disponible por defecto
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _context.Drivers.Add(driver);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Driver created with ID {DriverId} for user {UserId}", driver.Id, driver.UserId);

            return new DriverResponse
            {
                Driver = MapToProtoDriver(driver)
            };
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate key") == true)
        {
            throw new RpcException(new Status(StatusCode.AlreadyExists, "LICENSE_OR_USER_DUP"));
        }
        catch (RpcException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating driver for user {UserId}", request.UserId);
            throw new RpcException(new Status(StatusCode.Internal, "Internal server error"));
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
            throw new RpcException(new Status(StatusCode.Internal, "Internal server error"));
        }
    }

    [Authorize(Policy = "DriversReadAll")]
    public override async Task<ListDriversResponse> ListDrivers(ListDriversRequest request, ServerCallContext context)
    {
        try
        {
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
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

            var response = new ListDriversResponse
            {
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize,
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
