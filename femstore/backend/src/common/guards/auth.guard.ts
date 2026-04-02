import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { sendError } from '../helpers';

// Obtener JWT_SECRET - lanzar error si no existe en producción
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET no está configurado. Configure la variable de entorno JWT_SECRET.');
    }
    console.warn('⚠️ JWT_SECRET no configurado. Usando clave por defecto (NO seguro para producción).');
    return 'dev-secret-key-do-not-use-in-production';
  }
  return secret;
};

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Token de autenticación requerido', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    sendError(res, 'Token inválido o expirado', 401);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'No autenticado', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'No tienes permisos para realizar esta acción', 403);
      return;
    }

    next();
  };
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
      req.user = payload;
    } catch {
      // Token invalid but optional, continue
    }
  }

  next();
};
