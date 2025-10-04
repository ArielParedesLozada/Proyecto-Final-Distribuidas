import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token guardado al cargar la aplicación
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    // MODO SIMULADO - Solo frontend
    // TODO: Conectar con el backend real cuando esté disponible
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular validación básica
    if (!credentials.email || !credentials.password) {
      throw new Error('Email y contraseña son requeridos');
    }
    
    if (credentials.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    
    // Simular usuario autenticado
    const mockUser: User = {
      id: '1',
      email: credentials.email,
      name: credentials.email.split('@')[0]
    };
    
    const mockToken = 'mock-jwt-token-' + Date.now();
    
    // Guardar en localStorage
    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('userData', JSON.stringify(mockUser));
    
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
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
