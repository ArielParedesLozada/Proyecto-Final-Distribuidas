// Rutas de la aplicación
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  HOME: '/'
} as const;

// Claves para localStorage
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData'
} as const;

// Configuración de la aplicación
export const APP_CONFIG = {
  APP_NAME: 'Fuel Manager',
  APP_DESCRIPTION: 'Sistema de Gestión de Combustible',
  VERSION: '1.0.0'
} as const;

// Estados de vehículos
export const VEHICLE_STATUS = {
  AVAILABLE: 1,
  OCCUPIED: 2
} as const;

export const VEHICLE_STATUS_LABELS = {
  [VEHICLE_STATUS.AVAILABLE]: 'Disponible',
  [VEHICLE_STATUS.OCCUPIED]: 'Ocupado'
} as const;