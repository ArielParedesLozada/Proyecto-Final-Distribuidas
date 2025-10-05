import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { IUser } from '../interfaces/IUser';

interface AuthContextType {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (token) {
        try {
          // Verificar si el token es válido obteniendo datos del usuario
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            const user: IUser = {
              id: userData.id || '1',
              email: userData.email,
              name: userData.name,
              roles: userData.roles
            };
            setUser(user);
            localStorage.setItem('userData', JSON.stringify(user));
          } else {
            // Token inválido, limpiar
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
          }
        } catch (error) {
          console.error('Error loading user:', error);
          // En caso de error, limpiar tokens
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
        }
      }
      
      setIsLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      // Validación básica
      if (!credentials.email || !credentials.password) {
        throw new Error('Email y contraseña son requeridos');
      }
      
      if (credentials.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
      
      // Llamada real al backend a través del gateway
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No se recibió token del servidor');
      }
      
      // Guardar token en localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('token', data.token); // Para compatibilidad con el interceptor
      
      // Crear objeto usuario con los datos recibidos
      const user: IUser = {
        id: data.id || '1', // El backend no devuelve ID en LoginReply, usar temporal
        email: data.email,
        name: data.name || data.email.split('@')[0], // Usar name si está disponible
        roles: data.roles
      };
      
      localStorage.setItem('userData', JSON.stringify(user));
      setUser(user);
      
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token'); // Para compatibilidad
    localStorage.removeItem('userData');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
