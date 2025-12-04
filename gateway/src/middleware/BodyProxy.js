import { createProxyMiddleware } from "http-proxy-middleware";

export class ProxyFactory {
  static create(target, pathRewrite = {}) {
    return createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite,
      selfHandleResponse: false,
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[BodyProxy] onProxyReq llamado para ${req.method} ${req.path}`);
        // El stream original debería estar disponible ya que no parseamos el body
        // http-proxy-middleware manejará el stream automáticamente
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[BodyProxy] Respuesta recibida: ${proxyRes.statusCode} para ${req.method} ${req.path}`);
      },
      onError: (err, req, res) => {
        console.error(`[BodyProxy] Error en proxy:`, err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Proxy error', message: err.message });
        }
      },
    });
  }
}