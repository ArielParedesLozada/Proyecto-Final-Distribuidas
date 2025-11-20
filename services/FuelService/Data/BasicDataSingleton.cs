namespace FuelService.Data;

public class BasicDataSingleton
{
    public List<string> Data { get; set; }
    private static BasicDataSingleton? instance;
    private BasicDataSingleton()
    {
        Data = [];
    }
    public static BasicDataSingleton GetBasicDataSingleton()
    {
        instance ??= new BasicDataSingleton();
        return instance;
    }
}