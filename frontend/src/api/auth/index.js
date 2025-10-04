// API de Autenticación - Para conectar con el backend
// Este archivo se usará cuando conectemos con el servicio de autenticación

export const authAPI = {
  // TODO: Implementar cuando se conecte con el backend
  login: async (credentials) => {
    // Llamada al endpoint /auth/login
    throw new Error('Backend no conectado aún');
  },

  me: async () => {
    // Llamada al endpoint /auth/me
    throw new Error('Backend no conectado aún');
  },

  logout: async () => {
    // Llamada al endpoint /auth/logout (opcional)
    return Promise.resolve();
  }
};
