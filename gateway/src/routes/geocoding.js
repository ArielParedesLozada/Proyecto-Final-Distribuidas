import { Router } from 'express';

export class GeocodingRoutes {
  constructor() {
    this.router = Router();
    // Rate limiting simple: última petición realizada
    this.lastRequestTime = 0;
    this.minRequestInterval = 1100; // 1.1 segundos entre peticiones (Nominatim requiere 1 segundo mínimo)
  }

  async start() {
    // Endpoint para reverse geocoding (obtener nombre del lugar desde coordenadas)
    this.router.get('/api/reverse-geocode', async (req, res) => {
      try {
        const { lat, lon, zoom = 18, addressdetails = 1 } = req.query;

        // Validar parámetros requeridos
        if (!lat || !lon) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Los parámetros lat y lon son requeridos'
          });
        }

        // Validar que lat y lon sean números válidos
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (isNaN(latitude) || isNaN(longitude)) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'lat y lon deben ser números válidos'
          });
        }

        // Validar rango de coordenadas
        if (latitude < -90 || latitude > 90) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'La latitud debe estar entre -90 y 90'
          });
        }

        if (longitude < -180 || longitude > 180) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'La longitud debe estar entre -180 y 180'
          });
        }

        // Rate limiting: esperar si la última petición fue hace menos de 1.1 segundos
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
          const waitTime = this.minRequestInterval - timeSinceLastRequest;
          console.log(`[Geocoding] Rate limiting: esperando ${waitTime}ms antes de la siguiente petición`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();

        // Construir URL de Nominatim
        const nominatimUrl = new URL('https://nominatim.openstreetmap.org/reverse');
        nominatimUrl.searchParams.set('format', 'json');
        nominatimUrl.searchParams.set('lat', latitude.toString());
        nominatimUrl.searchParams.set('lon', longitude.toString());
        nominatimUrl.searchParams.set('zoom', zoom.toString());
        nominatimUrl.searchParams.set('addressdetails', addressdetails.toString());

        console.log(`[Geocoding] Llamando a Nominatim: ${nominatimUrl.toString()}`);

        // Crear AbortController para timeout de 10 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          // Intentar primero con Nominatim
          let response = null;
          let data = null;
          
          try {
            // Hacer la petición a Nominatim con User-Agent mejorado y headers adicionales
            // Nominatim requiere un User-Agent válido con información de contacto
            response = await fetch(nominatimUrl.toString(), {
              headers: {
                'User-Agent': 'RouteManagementApp/1.0 (Route Management System; Contact: admin@routemanagement.local)',
                'Accept': 'application/json',
                'Accept-Language': 'es,en-US;q=0.9,en;q=0.8',
                'Referer': 'http://localhost:4000/',
              },
              signal: controller.signal,
            });

            if (response.ok) {
              data = await response.json();
              console.log(`[Geocoding] ✅ Nominatim respondió correctamente`);
              clearTimeout(timeoutId);
              return res.json(data);
            }
            
            // Si Nominatim falla, intentar con servicio alternativo
            const errorText = await response.text().catch(() => '');
            console.warn(`[Geocoding] ⚠️ Nominatim falló (${response.status}): ${errorText.substring(0, 100)}`);
            console.log(`[Geocoding] 🔄 Intentando con servicio alternativo...`);
          } catch (nominatimError) {
            console.warn(`[Geocoding] ⚠️ Error al llamar a Nominatim:`, nominatimError.message);
            console.log(`[Geocoding] 🔄 Intentando con servicio alternativo...`);
          }

          // Fallback: usar geocode.xyz (servicio alternativo gratuito)
          clearTimeout(timeoutId);
          const altController = new AbortController();
          const altTimeoutId = setTimeout(() => altController.abort(), 10000);
          
          try {
            const altUrl = `https://geocode.xyz/${latitude},${longitude}?geoit=json`;
            console.log(`[Geocoding] Llamando a servicio alternativo: ${altUrl}`);
            
            const altResponse = await fetch(altUrl, {
              headers: {
                'Accept': 'application/json',
              },
              signal: altController.signal,
            });

            clearTimeout(altTimeoutId);

            if (altResponse.ok) {
              const altData = await altResponse.json();
              
              // Formatear respuesta del servicio alternativo al formato esperado
              if (altData.standard && altData.standard.city) {
                const displayName = [
                  altData.standard.addresst || altData.standard.city,
                  altData.standard.prov || altData.standard.region,
                  altData.standard.countryname
                ].filter(Boolean).join(', ');
                
                console.log(`[Geocoding] ✅ Servicio alternativo respondió: ${displayName}`);
                return res.json({
                  display_name: displayName,
                  address: altData.standard
                });
              }
            }
            
            console.warn(`[Geocoding] ⚠️ Servicio alternativo también falló`);
          } catch (altError) {
            clearTimeout(altTimeoutId);
            console.warn(`[Geocoding] ⚠️ Error con servicio alternativo:`, altError.message);
          }

          // Si ambos servicios fallan, retornar error pero con mensaje útil
          if (response && response.status === 403) {
            return res.status(503).json({
              error: 'Service Unavailable',
              message: 'El servicio de geocodificación está temporalmente no disponible. Por favor, intente de nuevo en unos momentos.',
              status: response.status,
              retryAfter: 2
            });
          }
          
          return res.status(503).json({
            error: 'Service Unavailable',
            message: 'No se pudo obtener información del lugar. Por favor, intente de nuevo más tarde.',
            status: response?.status || 503
          });
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.error('[Geocoding] Timeout al llamar a Nominatim');
            return res.status(504).json({
              error: 'Gateway Timeout',
              message: 'La solicitud a Nominatim tardó demasiado tiempo'
            });
          }
          throw fetchError; // Re-lanzar para que sea capturado por el catch externo
        }
      } catch (error) {
        console.error('[Geocoding] Error interno:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Error al procesar la solicitud de geocodificación',
          details: error.message
        });
      }
    });

    console.log('✅ Geocoding routes iniciadas');
  }
}

