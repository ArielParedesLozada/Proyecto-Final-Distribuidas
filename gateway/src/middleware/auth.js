import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { expressjwt } from 'express-jwt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../config.env') });

const jwtOpts = {
  secret: process.env.JWT_SECRET || 'change-me',
  algorithms: ['HS256'],
  credentialsRequired: true,
  requestProperty: 'auth',
  getToken: (req) => {
    const raw = req.headers.authorization || req.headers.Authorization;
    if (!raw) return null;
    const [scheme, token] = String(raw).split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
    return token;
  },
};

// Solo valida iss/aud si están definidos
if (process.env.JWT_ISSUER) jwtOpts.issuer = process.env.JWT_ISSUER;
if (process.env.JWT_AUDIENCE) jwtOpts.audience = process.env.JWT_AUDIENCE;

export const auth = expressjwt(jwtOpts);

export const requireScopes = (...need) => (req, res, next) => {
  const scopes = (req.auth?.scope || '').toString().split(' ').filter(Boolean);
  if (!need.every(s => scopes.includes(s))) {
    return res.status(403).json({
      error: 'insufficient_scope',
      required: need,
      available: scopes
    });
  }
  next();
};
