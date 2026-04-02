import { Request, Response, NextFunction } from 'express';
import { encrypt, decrypt, tryDecrypt } from '../encryption';

// Campos sensibles que deben ser encriptados en requests
const SENSITIVE_FIELDS_REQUEST = ['phone', 'email', 'name', 'address', 'delivery_address'];

// Campos sensibles que deben ser desencriptados en responses
const SENSITIVE_FIELDS_RESPONSE = ['phone', 'email', 'name', 'delivery_address'];

/**
 * Middleware para desencriptar campos sensibles del body en requests
 */
export const decryptRequest = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }

  try {
    const decryptedBody = { ...req.body };
    
    for (const field of SENSITIVE_FIELDS_REQUEST) {
      if (decryptedBody[field] && typeof decryptedBody[field] === 'string') {
        decryptedBody[field] = tryDecrypt(decryptedBody[field]) || decryptedBody[field];
      }
    }

    // Desencriptar objetos anidados como user dentro de data
    if (decryptedBody.user && typeof decryptedBody.user === 'object') {
      for (const field of SENSITIVE_FIELDS_REQUEST) {
        if (decryptedBody.user[field] && typeof decryptedBody.user[field] === 'string') {
          decryptedBody.user[field] = tryDecrypt(decryptedBody.user[field]) || decryptedBody.user[field];
        }
      }
    }

    req.body = decryptedBody;
  } catch (error) {
    console.error('Error decrypting request:', error);
  }

  next();
};

/**
 * Middleware para encriptar campos sensibles del body antes de guardar
 * Aplica solo a requests que van a modificar datos (POST, PUT, PATCH)
 */
export const encryptRequest = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }

  // Solo encriptar en requests de escritura
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  try {
    const encryptedBody = { ...req.body };
    
    for (const field of SENSITIVE_FIELDS_REQUEST) {
      if (encryptedBody[field] && typeof encryptedBody[field] === 'string' && encryptedBody[field]) {
        encryptedBody[field] = encrypt(encryptedBody[field]);
      }
    }

    req.body = encryptedBody;
  } catch (error) {
    console.error('Error encrypting request:', error);
  }

  next();
};

/**
 * Función helper para desencriptar campos en respuestas JSON
 * Útil para usar en respuestas de API
 */
export const decryptResponse = <T extends Record<string, unknown>>(data: T): T => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const decrypted: Record<string, unknown> = { ...data };

  for (const field of SENSITIVE_FIELDS_RESPONSE) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decrypt(decrypted[field] as string);
    }
  }

  return decrypted;
};

/**
 * Función helper para encriptar campos en datos antes de guardar
 */
export const encryptForStorage = <T extends Record<string, unknown>>(data: T): Record<string, unknown> => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const encrypted: Record<string, unknown> = { ...data };

  for (const field of SENSITIVE_FIELDS_RESPONSE) {
    if (encrypted[field] && typeof encrypted[field] === 'string' && encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field] as string);
    }
  }

  return encrypted;
};

/**
 * Desencriptar array de objetos
 */
export const decryptArray = <T extends Record<string, unknown>>(items: T[]): T[] => {
  return items.map(item => decryptResponse(item));
};