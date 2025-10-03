namespace AuthService.Domain;

public class User
{
    public User(string email, string password, string nombre, string roles)
    {
        Email = email;
        Password = password;
        Nombre = nombre;
        Roles = roles;
    }
    public Guid Id { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string Nombre { get; set; }
    public string Roles { get; set; }

}