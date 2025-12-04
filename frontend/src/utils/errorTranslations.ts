// Función para formatear mensajes de error de forma más clara para el usuario
export const formatErrorMessage = (message: string): string => {
  // Extraer información de errores específicos
  if (message.includes('INVALID_DISTANCE')) {
    const match = message.match(/la distancia (\d+(?:\.\d+)?) debe ser mayor a (\d+(?:\.\d+)?)/);
    if (match) {
      const [, ingresada, calculada] = match;
      return `La distancia ingresada (${parseFloat(ingresada).toFixed(2)} km) es menor que la distancia real calculada (${parseFloat(calculada).toFixed(2)} km). Por favor, ingrese una distancia mayor o igual a ${parseFloat(calculada).toFixed(2)} km.`;
    }
    return 'La distancia ingresada no coincide con la distancia real entre las coordenadas. Verifique las coordenadas y la distancia.';
  }

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
    'ROUTE_NOT_FOUND': 'Ruta no encontrada',
    'DRIVER_NOT_AVAILABLE': 'El conductor no está disponible',
    'ASSIGNMENT_NOT_FOUND': 'Asignación no encontrada',
    'VEHICLE_IN_ACTIVE_ROUTE': 'El vehículo está siendo utilizado en una ruta activa. No se puede cambiar a disponible mientras tenga rutas asignadas o en curso.',
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
  
  // Verificar si el mensaje contiene VEHICLE_IN_ACTIVE_ROUTE
  if (message.includes('VEHICLE_IN_ACTIVE_ROUTE')) {
    const match = message.match(/VEHICLE_IN_ACTIVE_ROUTE:\s*(.+)/);
    if (match) {
      return match[1].trim();
    }
    return 'El vehículo está siendo utilizado en una ruta activa. No se puede cambiar a disponible mientras tenga rutas asignadas o en curso.';
  }

  // Limpiar mensajes de error HTTP
  const httpErrorMatch = message.match(/HTTP \d+ [^–]+ – (.+)/);
  if (httpErrorMatch) {
    return formatErrorMessage(httpErrorMatch[1]);
  }

  // Si no se encuentra traducción, devolver el mensaje original limpiado
  return message || 'Error desconocido';
};

// Función legacy para compatibilidad
export const translateErrorMessage = formatErrorMessage;
