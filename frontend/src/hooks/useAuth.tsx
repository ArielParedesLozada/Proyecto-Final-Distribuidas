// src/auth/useAuth.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { api } from "../api/api";

// Tipos de roles válidos
type UserRole = "ADMIN" | "SUPERVISOR" | "CONDUCTOR";

// =====================
// Tipos de autenticación
// =====================
interface AuthUser {
  token: string;
  email: string;
  roles: UserRole[];
  name?: string;
}

// Lo que persistimos en localStorage
interface AuthData {
  token: string;
  email: string;
  roles: string; // guardado como string (coma/espacios)
  name?: string;
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/** ===== Helpers JWT (para evitar refrescar con token vencido) ===== */
function decodeJwtExp(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "===".slice((b64.length + 3) % 4);
    const json = atob(padded);
    const obj = JSON.parse(json) as { exp?: number };
    return typeof obj.exp === "number" ? obj.exp : null;
  } catch {
    return null;
  }
}
function isExpired(token: string): boolean {
  const exp = decodeJwtExp(token);
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return now >= exp;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ---- helpers ----

  // Parsear roles desde string "A, B" o array ["A","B"]
  const parseRoles = (rolesInput: unknown): UserRole[] => {
    const validSet = new Set<UserRole>(["ADMIN", "SUPERVISOR", "CONDUCTOR"]);

    const fromString = (s: string) =>
      s
        .toString()
        .trim()
        .split(/[,\s]+/)
        .map((r) => r.trim().toUpperCase())
        .filter(Boolean) as UserRole[];

    let roles: string[] = [];

    if (Array.isArray(rolesInput)) {
      roles = rolesInput.map((r) => String(r));
    } else if (typeof rolesInput === "string") {
      roles = fromString(rolesInput);
    } else if (rolesInput != null) {
      roles = fromString(String(rolesInput));
    }

    const uniq: UserRole[] = [];
    for (const r of roles) {
      const upper = r.toUpperCase() as UserRole;
      if (validSet.has(upper) && !uniq.includes(upper)) uniq.push(upper);
    }
    return uniq;
  };

  const loadFromStorage = (): AuthUser | null => {
    try {
      const raw = localStorage.getItem("auth");
      if (!raw) return null;
      const parsed: AuthData = JSON.parse(raw);
      if (!parsed.token || !parsed.email) return null;

      // Evita refrescar sesión con token vencido
      if (isExpired(parsed.token)) {
        localStorage.removeItem("auth");
        return null;
      }

      return {
        token: parsed.token,
        email: parsed.email,
        roles: parseRoles(parsed.roles),
        name: parsed.name,
      };
    } catch (e) {
      console.error("Error parsing auth from storage", e);
      return null;
    }
  };

  const saveToStorage = (authUser: AuthUser): void => {
    const data: AuthData = {
      token: authUser.token,
      email: authUser.email,
      roles: authUser.roles.join(", "),
      name: authUser.name,
    };
    localStorage.setItem("auth", JSON.stringify(data));
  };

  const clearStorage = (): void => {
    localStorage.removeItem("auth");
  };

  // Llama /auth/me para completar name y normaliza claves
  const fetchMe = async (
    token: string,
    fallback?: { email?: string; roles?: UserRole[] }
  ): Promise<AuthUser> => {
    try {
      const me = (await api<Record<string, unknown>>("/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })) as Record<string, unknown>;

      // soporta { id/email/roles/name } o { Id/Email/Roles/Name }
      const email = (me.email ?? me.Email ?? fallback?.email ?? "") as string;
      const roles = parseRoles(me.roles ?? me.Roles ?? fallback?.roles ?? "");
      const name = (me.name ?? me.Name) as string | undefined;

      const u: AuthUser = { token, email, roles, name };
      setUser(u);
      saveToStorage(u);
      return u;
    } catch (err: unknown) {
      // Si /auth/me devuelve 401 en arranque (token inválido/vencido), limpiamos sin loguear ruido
      const msg = String((err as Error)?.message || err || "");
      const is401 = msg.includes("HTTP 401");
      if (is401) {
        clearStorage();
        setUser(null);
      } else {
        console.warn("[auth] /auth/me fallo:", msg);
      }
      if (fallback?.email && fallback?.roles) {
        const u: AuthUser = { token, email: fallback.email, roles: fallback.roles };
        setUser(u);
        saveToStorage(u);
        return u;
      }
      throw err;
    }
  };

  // ---- efectos ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = loadFromStorage();
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        const full = await fetchMe(stored.token, {
          email: stored.email,
          roles: stored.roles,
        });
        if (!cancelled) setUser(full);
      } catch {
        // ya limpiamos dentro de fetchMe cuando corresponde
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- acciones ----
  const login = async (email: string, password: string): Promise<AuthUser> => {
    if (!email || !password) throw new Error("Email y contraseña son requeridos");
    if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "omit",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err =
        (await response.json().catch(async () => await response.text().catch(() => ""))) || "";
      const msg =
        (typeof err === "string" ? err : (err as any)?.message) ||
        `Error ${response.status}: ${response.statusText}`;
      throw new Error(msg);
    }

    // Normaliza posibles nombres de propiedades
    const raw = (await response.json()) as Record<string, unknown>;
    const token =
      (raw.token || raw.Token || raw.access_token || raw.accessToken) as string | undefined;
    const emailResp = (raw.email || raw.Email) as string | undefined;
    const rolesResp = raw.roles ?? raw.Roles;

    if (!token || !emailResp || rolesResp == null) {
      throw new Error("Respuesta del servidor incompleta");
    }

    const parsedRoles = parseRoles(rolesResp);

    // provisional (por si /auth/me falla)
    const provisional: AuthUser = { token, email: emailResp, roles: parsedRoles };
    setUser(provisional);
    saveToStorage(provisional);

    // completa con /auth/me (si falla 401, mantenemos provisional)
    const fullUser = await fetchMe(token, { email: emailResp, roles: parsedRoles }).catch(() => {
      return provisional;
    });

    return fullUser;
  };

  const logout = (): void => {
    clearStorage();
    setUser(null);
    window.location.href = "/auth/login";
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user || !user.roles.length) return false;
    return roles.some((r) => user.roles.includes(r));
  };

  const primaryRole: UserRole | null = user?.roles[0] || null;

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    primaryRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
