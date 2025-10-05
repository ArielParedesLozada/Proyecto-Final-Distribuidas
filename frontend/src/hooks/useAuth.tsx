import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Tipos de roles válidos
type UserRole = "ADMIN" | "SUPERVISOR" | "CONDUCTOR";

// =====================
// Tipos de autenticación
// =====================
interface AuthUser {
  token: string;
  email: string;
  roles: UserRole[];
  name?: string; // <-- agregado
}

// Lo que persistimos en localStorage
interface AuthData {
  token: string;
  email: string;
  roles: string;   // guardado como string (coma/espacios)
  name?: string;   // <-- agregado
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ---- helpers ----

  // Parsear roles desde string (coma/espacios)
  const parseRoles = (rolesString: string): UserRole[] => {
    if (!rolesString || typeof rolesString !== 'string') return [];
    const roleParts = rolesString
      .toString()
      .trim()
      .split(/[,\s]+/)
      .map(r => r.trim())
      .filter(Boolean);

    const valid: UserRole[] = [];
    const set = new Set<UserRole>(["ADMIN", "SUPERVISOR", "CONDUCTOR"]);
    for (const r of roleParts) {
      const upper = r.toUpperCase() as UserRole;
      if (set.has(upper) && !valid.includes(upper)) valid.push(upper);
    }
    return valid;
  };

  const loadFromStorage = (): AuthUser | null => {
    try {
      const raw = localStorage.getItem('auth');
      if (!raw) return null;
      const parsed: AuthData = JSON.parse(raw);
      if (!parsed.token || !parsed.email) return null;

      return {
        token: parsed.token,
        email: parsed.email,
        roles: parseRoles(parsed.roles),
        name: parsed.name, // puede venir vacío si nunca se cargó /auth/me
      };
    } catch (e) {
      console.error('Error parsing auth from storage', e);
      return null;
    }
  };

  const saveToStorage = (authUser: AuthUser): void => {
    const data: AuthData = {
      token: authUser.token,
      email: authUser.email,
      roles: authUser.roles.join(', '),
      name: authUser.name,
    };
    localStorage.setItem('auth', JSON.stringify(data));
  };

  const clearStorage = (): void => {
    localStorage.removeItem('auth');
  };

  // Llama /auth/me para completar name (y roles si aplica)
  const fetchMe = async (token: string, fallback?: { email?: string; roles?: UserRole[] }): Promise<AuthUser> => {
    // aseguramos que el Authorization lo ponga fetch
    const resp = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) {
      // si falla, devolvemos con fallback (sin name)
      if (fallback?.email && fallback?.roles) {
        return { token, email: fallback.email, roles: fallback.roles };
      }
      throw new Error(`ME failed: ${resp.status}`);
    }

    const me = await resp.json() as { id?: string; email?: string; roles?: string; name?: string };
    const parsedRoles = parseRoles(me.roles ?? (fallback?.roles?.join(', ') || ''));
    const email = me.email ?? fallback?.email ?? '';
    const u: AuthUser = { token, email, roles: parsedRoles, name: me.name };

    setUser(u);
    saveToStorage(u);
    return u;
  };

  // ---- efectos ----

  useEffect(() => {
    (async () => {
      const stored = loadFromStorage();
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        // refresca y completa name desde /auth/me
        await fetchMe(stored.token, { email: stored.email, roles: stored.roles });
      } catch (e) {
        console.warn('Error refreshing /auth/me, clearing auth', e);
        clearStorage();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ---- acciones ----

  const login = async (email: string, password: string): Promise<AuthUser> => {
    if (!email || !password) throw new Error('Email y contraseña son requeridos');
    if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as { token?: string; email?: string; roles?: string };
    if (!data.token || !data.email || !data.roles) throw new Error('Respuesta del servidor incompleta');

    const parsedRoles = parseRoles(data.roles);

    // Primero guardamos token mínimo, luego /auth/me para traer name
    const provisional: AuthUser = { token: data.token, email: data.email, roles: parsedRoles };
    setUser(provisional);
    saveToStorage(provisional);

    // Completar con name desde /auth/me (usa fallback por si /auth/me falla)
    const fullUser = await fetchMe(data.token, { email: data.email, roles: parsedRoles });
    return fullUser;
  };

  const logout = (): void => {
    clearStorage();
    setUser(null);
    window.location.href = '/auth/login';
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user || !user.roles.length) return false;
    return roles.some(r => user.roles.includes(r));
  };

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
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
