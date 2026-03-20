import jwt from "jsonwebtoken";
/**
 * Genera un token JWT para un usuario.
 * @param {object} userData - { id, role } donde role es "user" | "business" | "staff"
 * @returns {{ planiaToken: string }}
 */
export declare function generateToken(userData: any): {
    planiaToken: never;
};
export declare function generateRefreshToken(userData: any): {
    refreshToken: never;
};
/**
 * Verifica un token y retorna el payload decodificado.
 * @param {string} token
 * @returns {object} Payload decodificado
 * @throws {Error} Si el token es inválido o ha expirado
 */
export declare function verifyToken(token: string): string | jwt.JwtPayload;
export declare function verifyRefreshToken(token: string): string | jwt.JwtPayload;
//# sourceMappingURL=jwt.d.ts.map