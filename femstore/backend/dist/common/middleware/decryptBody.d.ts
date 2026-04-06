import { Request, Response, NextFunction } from 'express';
/**
 * Middleware que desencripta campos sensibles del body antes de la validación.
 * Se usa en endpoints que reciben datos encriptados desde el frontend.
 *
 * Uso:
 *   router.post('/register', decryptBody('name', 'email', 'phone', 'password'), handler);
 */
export declare const decryptBody: (...fields: string[]) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=decryptBody.d.ts.map