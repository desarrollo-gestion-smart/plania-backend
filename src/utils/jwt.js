import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || "365d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET debe estar definido en las variables de entorno (.env)");
}

/**
 * Genera un token JWT para un usuario.
 * @param {object} userData - { id, role } donde role es "user" | "business" | "staff"
 * @returns {{ planiaToken: string }}
 */
export function generateToken(userData) {
  const payload = {
    userId: userData.id,
    role: userData.role,
  };

  return {
    planiaToken: jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_EXPIRATION,
      algorithm: "HS256",
    }),
  };
}

/**
 * Verifica un token y retorna el payload decodificado.
 * @param {string} token
 * @returns {object} Payload decodificado
 * @throws {Error} Si el token es inválido o ha expirado
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
}
