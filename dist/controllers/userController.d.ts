export declare const registerUser: (req: any, res: any) => Promise<any>;
export declare const verifyUser: (req: any, res: any) => Promise<any>;
export declare const loginBusiness: (req: any, res: any) => Promise<any>;
/** Login de negocio: requiere numero y password. POST /api/login-business */
export declare const loginBusinessWithPassword: (req: any, res: any) => Promise<any>;
export declare const resendBusiness: (req: any, res: any) => Promise<any>;
export declare const uploadBusinessAvatar: (req: any, res: any) => Promise<any>;
export declare const uploadBusinessBanner: (req: any, res: any) => Promise<any>;
export declare const verifyBusiness: (req: any, res: any) => Promise<any>;
export declare const resendCode: (req: any, res: any) => Promise<any>;
export declare const registerBusiness: (req: any, res: any) => Promise<any>;
export declare const configureBusiness: (req: any, res: any) => Promise<any>;
export declare const getBusinessInfo: (req: any, res: any) => Promise<any>;
export declare const getBusinessPoliciesController: (req: any, res: any) => Promise<any>;
export declare const updateBusinessPoliciesController: (req: any, res: any) => Promise<any>;
export declare const getUsers: (req: any, res: any) => Promise<any>;
export declare const getClients: (req: any, res: any) => Promise<any>;
export declare const getClient: (req: any, res: any) => Promise<any>;
export declare const updateClient: (req: any, res: any) => Promise<any>;
export declare const deleteClient: (req: any, res: any) => Promise<any>;
export declare const getBusinessIds: (req: any, res: any) => Promise<any>;
/** DELETE /api/delete-business - Elimina un usuario de negocio y sus datos relacionados. */
export declare const deleteBusiness: (req: any, res: any) => Promise<any>;
//# sourceMappingURL=userController.d.ts.map