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

  const fetchOptions: RequestInit = {
    // No usamos cookies/sesión del navegador
    credentials: "omit",
    ...init,
    headers,
  };

  const response = await fetch(fullUrl, fetchOptions);

  if (!response.ok) {
    // Si el server devolvió JSON o texto, intenta dar más contexto:
    let details = "";
    try {
      const ct = response.headers.get("content-type")?.toLowerCase() || "";
      if (ct.includes("application/json")) {
        const maybeJson = await response.json();
        details =
          typeof maybeJson === "string"
            ? maybeJson
            : maybeJson?.message || JSON.stringify(maybeJson);
      } else {
        details = await response.text();
      }
    } catch {
      /* ignore */
    }

    const msg = details
      ? `HTTP ${response.status} ${response.statusText || ""} – ${details}`.trim()
      : `HTTP ${response.status} ${response.statusText || ""}`.trim();

    // Si es 401, borra el token corrupto para evitar loops
    if (response.status === 401) {
      try {
        localStorage.removeItem("auth");
      } catch {
        /* ignore */
      }
    }

    throw new Error(msg);
  }

  // 204 No Content
  if (response.status === 204) return undefined as unknown as T;

  const ct = response.headers.get("content-type")?.toLowerCase() || "";
  if (ct.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

export { API_BASE_URL };
export default api;
