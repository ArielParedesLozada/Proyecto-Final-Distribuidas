import 'dotenv/config';
import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

// Middleware de autenticación JWT
export const auth = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: process.env.JWKS_URI
  }),
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE || undefined,
  algorithms: ["RS256"]
});

// Middleware para verificar scopes específicos
export const requireScopes = (...need) => (req, res, next) => {
  const scopes = (req.auth?.scope || req.auth?.scopes || "").toString().split(" ").filter(Boolean);
  
  if (!need.every(s => scopes.includes(s))) {
    return res.status(403).json({ error: "insufficient_scope" });
  }
  
  next();
};
