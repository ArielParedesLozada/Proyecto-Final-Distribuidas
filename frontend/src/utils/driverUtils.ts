// Utility functions for driver data mapping

/**
 * Maps capability number to display text
 * @param capability - The capability number (1, 2, or 3)
 * @returns Display text for the capability
 */
export const mapCapability = (capability: number): string => {
  switch (capability) {
    case 1:
      return "Liviana";
    case 2:
      return "Pesada";
    case 3:
      return "Ambas";
    default:
      return "Desconocida";
  }
};

/**
 * Maps availability number to display text
 * @param availability - The availability number (1, 2, or 3)
 * @returns Display text for the availability
 */
export const mapAvailability = (availability: number): string => {
  switch (availability) {
    case 1:
      return "Disponible";
    case 2:
      return "Ocupado";
    case 3:
      return "Fuera de servicio";
    default:
      return "Desconocida";
  }
};

/**
 * Maps capability number to CSS color class
 * @param capability - The capability number
 * @returns CSS color class for the capability badge
 */
export const getCapabilityColor = (capability: number): string => {
  switch (capability) {
    case 1:
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case 2:
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case 3:
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

/**
 * Maps availability number to CSS color class
 * @param availability - The availability number
 * @returns CSS color class for the availability badge
 */
export const getAvailabilityColor = (availability: number): string => {
  switch (availability) {
    case 1:
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case 2:
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case 3:
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

/**
 * Formats a date string to a readable format
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};
