import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar si hay datos de usuario guardados
    const savedUser = localStorage.getItem('userData');
    const token = localStorage.getItem('authToken');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (credentials) => {
    // 🔄 MODO SIMULADO - Solo frontend
    // TODO: Conectar con backend usando authAPI cuando esté listo
    
    // Simular validación básica
    if (credentials.email && credentials.password) {
      const mockUser = {
        email: credentials.email,
        roles: 'admin',
        name: 'Usuario Demo'
      };
      
      // Guardar en localStorage
      localStorage.setItem('authToken', 'mock-token-123');
      localStorage.setItem('userData', JSON.stringify(mockUser));
      
      // Actualizar estado
      setUser(mockUser);
      setIsAuthenticated(true);
      
      return { success: true, user: mockUser };
    } else {
      throw new Error('Email y contraseña son requeridos');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
