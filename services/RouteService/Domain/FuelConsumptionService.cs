namespace RouteService.Domain;

public class FuelConsumptionService
{
    public static void CalculateEstimatedConsumption(Route route, string type, string model, int year, double capacity)
    {
        // 1. Consumos base por tipo
        double baseConsumption = type.ToLower() switch
        {
            "liviano" => 8.0,
            "camioneta" => 10.5,
            "suv" => 11.5,
            "furgon" => 12.0,
            "pesado" => 25.0,
            _ => 10.0 // valor por defecto
        };

        // 2. Factor por edad
        int vehicleAge = DateTime.UtcNow.Year - year;
        double ageFactor = 1.0;
        if (vehicleAge > 5) ageFactor += 0.05;
        if (vehicleAge > 10) ageFactor += 0.10;
        if (vehicleAge > 15) ageFactor += 0.20;

        double engineFactor = 1.0;
        if (capacity > 2.0) engineFactor += 0.10;
        if (capacity > 3.0) engineFactor += 0.20;

        double finalConsumptionPer100Km = baseConsumption * ageFactor * engineFactor;

        double estimatedLiters = finalConsumptionPer100Km * (route.EstimatedDistanceKm / 100.0);

        route.EstimatedFuelConsumptionLiters = Math.Round(estimatedLiters, 2);
    }
}