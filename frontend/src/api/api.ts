const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Helper API que maneja automáticamente la autorización y errores
 * @param url - URL relativa o absoluta para la petición
 * @param init - Opciones adicionales de fetch (método, body, etc.)
 * @returns Promise con la respuesta parseada como JSON
 */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  // Construir URL completa
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  // Obtener token de localStorage
  const authData = localStorage.getItem('token');
  let token: string | null = null;

  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      token = parsed.token;
    } catch (error) {
      console.error('Error parsing auth data:', error);
    }
  }

  // Configurar headers por defecto
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Agregar Authorization header si hay token
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
    console.log('🔑 Token enviado:', token.substring(0, 20) + '...');
  } else {
    console.log('❌ No hay token disponible');
  }

  // Mergear headers del init con los por defecto
  const headers = {
    ...defaultHeaders,
    ...init?.headers,
  };

  // Configurar opciones de fetch
  const fetchOptions: RequestInit = {
    ...init,
    headers,
  };

  const response = await fetch(fullUrl, fetchOptions);

  // Si la respuesta no es ok, lanzar error
  if (!response.ok) {
    try {
      // Intentar parsear el error como JSON
      const errorData = await response.json();
      throw errorData;
    } catch (jsonError) {
      // Si no se puede parsear como JSON, lanzar error con statusText
      throw new Error(response.statusText || `HTTP ${response.status} error-sigma: ${jsonError}`);
    }
  }

  // Parsear respuesta como JSON
  const data = await response.json();
  return data as T;
}

// Exportar también la URL base por si se necesita
export { API_BASE_URL };

// Exportar por defecto la función api para compatibilidad
export default api;