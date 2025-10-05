// Función para traducir mensajes de error del backend al español
export const translateErrorMessage = (message: string): string => {
  // Mensajes de error comunes del backend
  const errorTranslations: Record<string, string> = {
    'User not found': 'Usuario no encontrado',
    'Wrong password': 'Contraseña incorrecta',
    'Invalid credentials': 'Credenciales inválidas',
    'Email and password are required': 'Email y contraseña son requeridos',
    'Password must be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Email y contraseña son requeridos': 'Email y contraseña son requeridos',
    'La contraseña debe tener al menos 6 caracteres': 'La contraseña debe tener al menos 6 caracteres',
    'No se recibió token del servidor': 'No se recibió token del servidor',
    'Error de conexión': 'Error de conexión al servidor',
    'Failed to fetch': 'Error de conexión al servidor',
    'Network error': 'Error de red',
    'Connection refused': 'Servidor no disponible',
    'Timeout': 'Tiempo de espera agotado',
    'Unauthorized': 'No autorizado',
    'Forbidden': 'Acceso denegado',
    'Not found': 'No encontrado',
    'Internal server error': 'Error interno del servidor',
    'Bad request': 'Solicitud incorrecta',
    'User not authenticated': 'Usuario no autenticado',
    'Token expired': 'Sesión expirada',
    'Invalid token': 'Token inválido',
  };

  // Buscar traducción exacta
  if (errorTranslations[message]) {
    return errorTranslations[message];
  }

  // Buscar traducciones parciales (para mensajes más largos)
  for (const [english, spanish] of Object.entries(errorTranslations)) {
    if (message.toLowerCase().includes(english.toLowerCase())) {
      return spanish;
    }
  }

  // Si no se encuentra traducción, devolver el mensaje original
  return message || 'Error desconocido';
};
