namespace RouteService.Domain;

public class FuelConsumptionService
{
    public static void CalculateEstimatedConsumption(
        Route route,
        int machinery,
        string type,
        int year,
        double capacity
    )
    {
        double baseConsumption = GetBaseConsumption(type);
        double ageFactor = GetAgeFactor(year);
        double engineFactor = GetEngineFactor(capacity);
        double machineryFactor = GetMachineryFactor(machinery);
        double finalConsumptionPer100Km =
            baseConsumption
            * ageFactor
            * engineFactor
            * machineryFactor;
        double estimatedLiters = finalConsumptionPer100Km * (route.EstimatedDistanceKm / 100.0);
        route.EstimatedFuelConsumptionLiters = Math.Round(estimatedLiters, 2);
    }
    private static double GetBaseConsumption(string type)
    {
        return type.ToLower() switch
        {
            "moto" => 8.0,
            "camioneta" => 10.5,
            "automovil" => 11.5,
            "auto" => 11.5,
            "bus" => 12.0,
            "camion" => 25.0,
            _ => 10.0
        };
    }
    private static double GetAgeFactor(int year)
    {
        int vehicleAge = DateTime.UtcNow.Year - year;

        double factor = 1.0;

        if (vehicleAge > 5) factor += 0.05;
        if (vehicleAge > 10) factor += 0.10;
        if (vehicleAge > 15) factor += 0.20;

        return factor;
    }
    private static double GetEngineFactor(double capacity)
    {
        double factor = 1.0;

        if (capacity > 2.0) factor += 0.10;
        if (capacity > 3.0) factor += 0.20;

        return factor;
    }
    private static double GetMachineryFactor(int machinery)
    {
        return machinery switch
        {
            0 => 1.00, // LIVIANO
            1 => 1.15, // PESADO
            _ => 1.00
        };
    }
}