namespace VehiclesService.Configs;

public static class AuthPolicies
{
    public const string VehiclesCreate    = "VehiclesCreate";
    public const string VehiclesReadAll   = "VehiclesReadAll";
    public const string VehiclesReadOwn   = "VehiclesReadOwn";
    public const string VehiclesUpdateAny = "VehiclesUpdateAny";
    public const string VehiclesAssign    = "VehiclesAssign";
    public const string VehiclesReadAllOrAssign = "VehiclesReadAllOrAssign"; // Admin + Supervisor
}
