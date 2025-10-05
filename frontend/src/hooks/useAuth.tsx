import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Tipos de roles válidos
type UserRole = "ADMIN" | "SUPERVISOR" | "CONDUCTOR";

// Interfaz del usuario autenticado
interface AuthUser {
  token: string;
  email: string;
  roles: UserRole[];
}

// Interfaz de datos persistentes en localStorage
interface AuthData {
  token: string;
  email: string;
  roles: string; // Se almacena como string separado por comas/espacios
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  primaryRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para parsear roles desde string
  // Ejemplos de entrada válida:
  // "ADMIN" → ["ADMIN"]
  // "ADMIN,CONDUCTOR" → ["ADMIN", "CONDUCTOR"]
  // "admin supervisor" → ["ADMIN", "SUPERVISOR"]
  // "  CONDUCTOR , ADMIN  " → ["CONDUCTOR", "ADMIN"]
  // "INVALID,ADMIN" → ["ADMIN"] (filtra roles inválidos)
  const parseRoles = (rolesString: string): UserRole[] => {
    if (!rolesString || typeof rolesString !== 'string') return [];
    
    // Normalizar: convertir a string, quitar espacios extra, separar por comas o espacios
    const normalizedString = rolesString.toString().trim();
    if (!normalizedString) return [];
    
    // Separar por comas, espacios, o ambos
    const roleParts = normalizedString
      .split(/[,\s]+/) // Separar por coma, espacio, o ambos
      .map(role => role.trim()) // Quitar espacios extra
      .filter(role => role.length > 0); // Filtrar strings vacíos
    
    // Convertir a mayúsculas y validar
    const validRoles: UserRole[] = [];
    const validRoleSet = new Set(["ADMIN", "SUPERVISOR", "CONDUCTOR"]);
    
    for (const role of roleParts) {
      const upperRole = role.toUpperCase() as UserRole;
      if (validRoleSet.has(upperRole) && !validRoles.includes(upperRole)) {
        validRoles.push(upperRole);
      }
    }
    
    return validRoles;
  };

  // Función para cargar datos desde localStorage
  const loadFromStorage = (): AuthUser | null => {
    try {
      const authData = localStorage.getItem('auth');
      if (!authData) return null;
      
      const parsed: AuthData = JSON.parse(authData);
      if (!parsed.token || !parsed.email) return null;
      
      return {
        token: parsed.token,
        email: parsed.email,
        roles: parseRoles(parsed.roles)
      };
    } catch (error) {
      console.error('Error parsing auth data from localStorage:', error);
      return null;
    }
  };

  // Función para guardar datos en localStorage
  const saveToStorage = (authUser: AuthUser): void => {
    const authData: AuthData = {
      token: authUser.token,
      email: authUser.email,
      roles: authUser.roles.join(', ') // Guardar como string separado por comas
    };
    localStorage.setItem('auth', JSON.stringify(authData));
  };

  // Función para limpiar datos del storage
  const clearStorage = (): void => {
    localStorage.removeItem('auth');
  };

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = loadFromStorage();
      
      if (storedUser) {
        try {
          // Verificar si el token es válido obteniendo datos del usuario
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${storedUser.token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            // Actualizar con datos del servidor si es necesario
            const updatedUser: AuthUser = {
              token: storedUser.token,
              email: userData.email || storedUser.email,
              roles: parseRoles(userData.roles || storedUser.roles.join(', '))
            };
            setUser(updatedUser);
            saveToStorage(updatedUser);
          } else {
            // Token inválido, limpiar
            clearStorage();
            setUser(null);
          }
        } catch (error) {
          console.error('Error loading user:', error);
          // En caso de error, limpiar datos
          clearStorage();
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    try {
      // Validación básica
      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }
      
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
      
      // Llamada al backend a través del gateway
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.token || !data.email || !data.roles) {
        throw new Error('Respuesta del servidor incompleta');
      }
      
      // Parsear roles desde string
      const parsedRoles = parseRoles(data.roles);
      
      // Crear objeto usuario autenticado
      const authUser: AuthUser = {
        token: data.token,
        email: data.email,
        roles: parsedRoles
      };
      
      // Guardar en localStorage y estado
      saveToStorage(authUser);
      setUser(authUser);
      
      return authUser;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = (): void => {
    clearStorage();
    setUser(null);
    // Navegar al login después del logout
    window.location.href = '/auth/login';
  };

  // Función para verificar si el usuario tiene alguno de los roles especificados
  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user || !user.roles.length) return false;
    return roles.some(role => user.roles.includes(role));
  };

  // Función para obtener el rol primario (primer rol o null)
  const primaryRole: UserRole | null = user?.roles[0] || null;

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    primaryRole
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
