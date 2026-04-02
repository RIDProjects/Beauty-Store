import { Request, Response, NextFunction } from 'express';
/**
 * Middleware para desencriptar campos sensibles del body en requests
 */
export declare const decryptRequest: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware para encriptar campos sensibles del body antes de guardar
 * Aplica solo a requests que van a modificar datos (POST, PUT, PATCH)
 */
export declare const encryptRequest: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=encryption.middleware.d.ts.map