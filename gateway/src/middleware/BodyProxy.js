import { createProxyMiddleware } from "http-proxy-middleware";

export class ProxyFactory {
  static create(target, pathRewrite = {}) {
    return createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite,
      selfHandleResponse: false,
      onProxyReq: (proxyReq, req, res) => {
        if (req.body) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader("Content-Type", "application/json");
          proxyReq.write(bodyData);
        }
      },
    });
  }
}