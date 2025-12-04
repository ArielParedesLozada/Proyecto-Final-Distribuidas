// src/api/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/** Obtiene el token desde localStorage soportando varias formas. */
function getTokenFromStorage(): string | null {
  try {
    // Forma principal de tu app
    const rawAuth = localStorage.getItem("auth");
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth); // { token, email, roles, name? }
      if (parsed?.token && typeof parsed.token === "string") return parsed.token;
    }

    // Formas “legadas”
    const rawToken = localStorage.getItem("token");
    if (!rawToken) return null;

    // a) token plano
    if (!rawToken.startsWith("{")) return rawToken;

    // b) objeto JSON { token: '...' }
    const parsedLegacy = JSON.parse(rawToken);
    if (parsedLegacy?.token && typeof parsedLegacy.token === "string") {
      return parsedLegacy.token;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Helper API que maneja automáticamente la autorización y errores.
 * @param url - URL relativa o absoluta para la petición
 * @param init - Opciones adicionales de fetch (método, body, etc.)
 */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  const token = getTokenFromStorage();

  // No fuerces Content-Type si el body es FormData
  const isFormData = init?.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    Accept: "application/json",
  };

  if (token) {
    // Cabecera en mayúscula (el proxy ya la baja si hace falta)
    defaultHeaders.Authorization = `Bearer ${token}`;
    console.log("🔑 Token enviado:", token.substring(0, 20) + "...");
  } else {
    console.log("❌ No hay token disponible");
  }

  const headers = {
    ...defaultHeaders,
    ...(init?.headers as Record<string, string> | undefined),
  };

  // Agregar timeout de 30 segundos
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.error("⏱️ Timeout: La petición tardó más de 30 segundos");
  }, 30000);

  const fetchOptions: RequestInit = {
    // No usamos cookies/sesión del navegador
    credentials: "omit",
    ...init,
    headers,
    signal: controller.signal,
  };

  try {
    const response = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
    // Si el server devolvió JSON o texto, intenta dar más contexto:
    let details = "";
    let errorCode: string | undefined;
    let errorMessage: string | undefined;
    
    try {
      const ct = response.headers.get("content-type")?.toLowerCase() || "";
      if (ct.includes("application/json")) {
        const maybeJson = await response.json();
        
        // Detectar códigos específicos del backend
        if (typeof maybeJson === "object" && maybeJson !== null) {
          errorCode = maybeJson.code;
          errorMessage = maybeJson.message;
          
          details = maybeJson.message || JSON.stringify(maybeJson);
        } else if (typeof maybeJson === "string") {
          details = maybeJson;
        } else {
          details = JSON.stringify(maybeJson);
        }
      } else {
        details = await response.text();
      }
    } catch {
      /* ignore */
    }

    const msg = details
      ? `HTTP ${response.status} ${response.statusText || ""} – ${details}`.trim()
      : `HTTP ${response.status} ${response.statusText || ""}`.trim();

    // Caso especial: perfil de conductor incompleto (estado esperado, no es error del sistema)
    if (errorCode === "DRIVER_PROFILE_INCOMPLETE") {
      console.info("ℹ️ Perfil de conductor incompleto:", errorMessage || msg);
      const error = new Error(errorMessage || msg);
      (error as any).code = errorCode;
      throw error;
    }

    // Si es 401, verificar si es un problema de token o de servicio
    if (response.status === 401) {
      // Solo redirigir al login si el error es específicamente de token inválido/expirado
      // No redirigir si es un error de servicio no disponible o gRPC
      const isTokenError = 
        details.includes("Invalid token") || 
        details.includes("Token expired") ||
        (details.includes("Unauthorized") && !details.includes("gRPC") && !details.includes("Bad gRPC"));
      
      // Si es un error de gRPC o servicio no disponible, NO limpiar el token
      const isServiceError = 
        details.includes("gRPC") || 
        details.includes("Bad gRPC") ||
        details.includes("Service Unavailable");
      
      if (isTokenError && !isServiceError) {
        try {
          localStorage.removeItem("auth");
          localStorage.removeItem("token"); // Limpiar también tokens legacy
          // Solo redirigir si no estamos ya en la página de login
          if (!window.location.pathname.includes("/auth/login")) {
            console.warn("⚠️ Token inválido o expirado. Redirigiendo al login...");
            // Usar setTimeout para evitar problemas con el estado de React
            setTimeout(() => {
              window.location.href = "/auth/login";
            }, 100);
          }
        } catch {
          /* ignore */
        }
      } else if (isServiceError) {
        // Si es un error de servicio, solo loguear el error sin cerrar sesión
        console.warn("⚠️ Error 401 por servicio no disponible:", details);
        console.warn("💡 Verifica que AdminService esté corriendo");
      } else {
        // Otros errores 401, solo limpiar token si es explícitamente de autenticación
        console.warn("⚠️ Error 401:", details);
      }
    }

      // Para otros errores, log normal
      console.error("❌ API Error:", msg);
      throw new Error(msg);
    }

    // 204 No Content
    if (response.status === 204) return undefined as unknown as T;

    const ct = response.headers.get("content-type")?.toLowerCase() || "";
    if (ct.includes("application/json")) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('La petición tardó demasiado tiempo. Verifica que el servicio esté disponible.');
    }
    throw error;
  }
}

export { API_BASE_URL };
export default api;
