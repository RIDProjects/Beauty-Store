import { Request, Response, NextFunction } from 'express';
import { decrypt } from '../encryption';

/**
 * Middleware que desencripta campos sensibles del body antes de la validación.
 * Se usa en endpoints que reciben datos encriptados desde el frontend.
 * 
 * Uso:
 *   router.post('/register', decryptBody('name', 'email', 'phone', 'password'), handler);
 */
export const decryptBody = (...fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    for (const field of fields) {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = decrypt(req.body[field]);
      }
    }

    next();
  };
};
