import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || "8h";
const REFRESH_SECRET = (process.env.JWT_REFRESH_SECRET || JWT_SECRET);
const REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || "30d";
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
            jwtid: randomUUID(),
        }),
    };
}
export function generateRefreshToken(userData) {
    const payload = {
        userId: userData.id,
        role: userData.role,
        type: "refresh",
    };
    return {
        refreshToken: jwt.sign(payload, REFRESH_SECRET, {
            expiresIn: REFRESH_EXPIRATION,
            algorithm: "HS256",
            jwtid: randomUUID(),
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
export function verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_SECRET, { algorithms: ["HS256"] });
}
//# sourceMappingURL=jwt.js.map