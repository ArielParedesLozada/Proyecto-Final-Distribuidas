namespace AuthService.Domain;

public class User
{
    // Borra si se requieren migraciones
    public User(string id, string email, string password, string nombre, string roles)
    {
        Id = id;
        Email = email;
        Password = password;
        Nombre = nombre;
        Roles = roles;
    }
    public string Id { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string Nombre { get; set; }
    public string Roles { get; set; }

}