import CryptoJS from 'crypto-js';

// La clave debe coincidir con la del backend (usar variable de entorno)
// Para desarrollo: mismo valor que ENCRYPTION_KEY en backend
const getEncryptionKey = (): string => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENCRYPTION_KEY) {
    return process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
  }
  // Fallback para desarrollo - debe coincidir con backend
  return process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'femstore-dev-key-change-in-prod';
};

/**
 * Encripta datos sensibles
 */
export const encrypt = (plainText: string): string => {
  if (!plainText) return plainText;
  return CryptoJS.AES.encrypt(plainText, getEncryptionKey()).toString();
};

/**
 * Desencripta datos sensibles
 */
export const decrypt = (encryptedData: string): string => {
  if (!encryptedData) return encryptedData;
  
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, getEncryptionKey());
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    // Si no se puede desencriptar, devolver el original (backwards compatibility)
    return encryptedData;
  }
};

/**
 * Encripta campos específicos de un objeto
 */
export const encryptFields = <T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: string[]
): T => {
  const encrypted: Record<string, any> = { ...data };
  
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] && typeof encrypted[field] === 'string' && encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field] as string);
    }
  }
  
  return encrypted as T;
};

/**
 * Desencripta campos específicos de un objeto
 */
export const decryptFields = <T extends Record<string, any>>(
  data: T,
  fieldsToDecrypt: string[]
): T => {
  const decrypted: Record<string, any> = { ...data };
  
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decrypt(decrypted[field] as string);
    }
  }
  
  return decrypted as T;
};

/**
 * Encripta el payload completo antes de enviar al backend
 */
export const encryptPayload = (payload: Record<string, unknown>): Record<string, unknown> => {
  const sensitiveFields = ['customer_phone', 'customer_email', 'delivery_address', 'notes'];
  return encryptFields(payload, sensitiveFields);
};

/**
 * Desencripta un objeto completo con campos sensibles
 */
export const decryptResponse = <T extends Record<string, any>>(response: T): T => {
  const sensitiveFields = ['customer_phone', 'customer_email', 'delivery_address', 'notes'];
  return decryptFields(response, sensitiveFields);
};