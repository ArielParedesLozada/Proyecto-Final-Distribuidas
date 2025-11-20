using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using DomainCoordinate = RouteService.Domain.Coordinate;

namespace RouteService.Infraestructure.Coordinates;

public class CoordinatesConverterFactory
{
    private readonly GeometryFactory _geometryFactory;

    public CoordinatesConverterFactory()
    {
        _geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
    }

    public ValueConverter<DomainCoordinate, Point> CreateConverter()
    {
        return new ValueConverter<DomainCoordinate, Point>(
            toProvider => _geometryFactory.CreatePoint(new Coordinate(toProvider.Longitude, toProvider.Latitude)),
            fromProvider => new DomainCoordinate(fromProvider.Y, fromProvider.X)
        );
    }
}