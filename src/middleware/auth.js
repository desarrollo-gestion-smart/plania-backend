import { verifyToken } from "../utils/jwt.js";
import admin from "firebase-admin";

/**
 * Middleware de autenticación JWT.
 * Verifica el token en el header Authorization: Bearer <token>
 * Si es válido, adjunta el payload decodificado a req.user
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : (typeof req.query?.access_token === "string" ? req.query.access_token : null);

  if (!token) {
    return res.status(401).json({ error: "Token de acceso requerido" });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.jti) {
      const doc = await admin.firestore().collection("revokedTokens").doc(decoded.jti).get();
      if (doc.exists) {
        return res.status(401).json({ error: "Token revocado", code: "TOKEN_REVOKED" });
      }
    }
    req.user = decoded; // { userId, role, iat, exp, jti? }
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado", code: "TOKEN_EXPIRED" });
    }
    return res.status(403).json({ error: "Token inválido", code: "TOKEN_INVALID" });
  }
}

/**
 * Middleware de autorización por roles.
 * Uso: authorizeRoles("business", "staff") — solo permite esos roles.
 * Debe usarse DESPUÉS de authenticateToken.
 * @param  {...string} allowedRoles - Roles permitidos ("user", "business", "staff")
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "No tienes permisos para acceder a este recurso" });
    }

    next();
  };
}
