import { useNavigate } from "react-router-dom";
import API from "../api/api";

interface LoginResponse {
    token?: string
    email: string,
    roles: string
}

function Login() {
    const navigate = useNavigate();

    const apiCall = async (email: string, password: string) => {
        try {
            const response = await API.post<LoginResponse>('/auth/login', {
                email,
                password
            });
            console.log(response.data);
            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
                navigate('/me');
            }
        } catch (error) {
            console.error('Error en el login:', error);
        }
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        apiCall(username, password);
    }

    return (
        <div>
            <h1>Iniciar Sesión</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Usuario:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">Contraseña:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                    />
                </div>

                <button type="submit">Ingresar</button>
            </form>

            <div>
                <a href="#">¿Olvidaste tu contraseña?</a>
            </div>
        </div>
    );
}

export default Login;