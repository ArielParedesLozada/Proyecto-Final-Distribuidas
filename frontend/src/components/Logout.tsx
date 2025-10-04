import { useNavigate } from "react-router-dom";

function Logout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");        
        console.log("Sesión cerrada exitosamente");
        navigate("/login");
    }

    return (
        <button 
            onClick={handleLogout}
            style={{
                padding: "8px 16px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
            }}
        >
            Cerrar Sesión
        </button>
    );
}

export default Logout;