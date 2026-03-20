/**
 * Middleware de autenticación JWT.
 * Verifica el token en el header Authorization: Bearer <token>
 * Si es válido, adjunta el payload decodificado a req.user
 */
export declare function authenticateToken(req: any, res: any, next: any): Promise<any>;
/**
 * Middleware de autorización por roles.
 * Uso: authorizeRoles("business", "staff") — solo permite esos roles.
 * Debe usarse DESPUÉS de authenticateToken.
 * @param  {...string} allowedRoles - Roles permitidos ("user", "business", "staff")
 */
export declare function authorizeRoles(...allowedRoles: any[]): (req: any, res: any, next: any) => any;
//# sourceMappingURL=auth.d.ts.map