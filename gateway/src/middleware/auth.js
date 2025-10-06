import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const raw = req.headers["authorization"] || req.headers["Authorization"] || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : raw.trim();
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export const requireScopes = (...needed) => (req, res, next) => {
  const scopes = new Set(String(req.auth?.scope || "").split(/\s+/).filter(Boolean));
  if (needed.every(s => scopes.has(s))) return next();
  return res.status(403).json({ error: "Forbidden (missing scopes)" });
};
