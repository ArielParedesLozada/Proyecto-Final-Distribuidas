import { useEffect, useState } from "react"
import API from "../api/api"
import type { IUser } from "../interfaces/IUser"
import Logout from "../components/Logout"

function MePage() {
    const [me, setMe] = useState<IUser | null>(null)
    const [isLoading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    
    useEffect(() => {
        const getMe = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await API.get('/auth/me')
                setMe(response.data)
            } catch (error) {
                console.log(error);
                setError("Error al cargar los datos del usuario")
                setMe(null)
            } finally {
                setLoading(false)
            }
        }
        getMe()
    }, [])
    
    if (isLoading) {
        return <p>Cargando...</p>
    }
    
    if (error) {
        return <p style={{color: 'red'}}>{error}</p>
    }
    
    if (!me) {
        return <p>No se encontraron datos del usuario</p>
    }
    
    return (
        <div>
            <h1>Perfil de Usuario</h1>
            <p><strong>Nombre:</strong> {me.name}</p>
            <p><strong>Email:</strong> {me.email}</p>
            <p><strong>Roles:</strong> {me.roles}</p>
            <p><strong>ID:</strong> {me.id}</p>
            <Logout />
        </div>
    )
}

export default MePage