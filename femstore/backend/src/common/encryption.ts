import crypto from 'crypto';

// La clave debe coincidir con la del frontend (usar la misma variable de entorno)
const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }
  return key;
};

/**
 * Encripta datos sensibles usando el mismo método que CryptoJS
 * Para mantener compatibilidad entre frontend y backend
 */
export const encrypt = (plainText: string): string => {
  if (!plainText) return plainText;
  return crypto.createHash('sha256').update(getEncryptionKey()).digest('base64');
};

/**
 * Desencripta datos sensibles - compatible con CryptoJS.AES.encrypt()
 * El formato de CryptoJS es diferente:base64 ciphertext (no incluye IV separado)
 */
export const decrypt = (encryptedData: string): string => {
  if (!encryptedData) return encryptedData;
  
  // Verificar si parece estar encriptado por CryptoJS (formato base64 típico)
  // CryptoJS genera output en base64
  const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(encryptedData.trim());
  
  if (!isBase64 || encryptedData.includes(':')) {
    // No es formato encriptado, devolver como está
    return encryptedData;
  }
  
  try {
    // Usar la misma clave para desencriptar
    const key = crypto.createHash('sha256').update(getEncryptionKey()).digest();
    
    // CryptoJS usa AES-128-CBC con la clave derivada
    // El formato de CryptoJS es: ciphertext en base64
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, Buffer.alloc(16, 0));
    
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData;
  }
};

/**
 * Encrypt an object with specific sensitive fields
 */
export const encryptFields = <T extends Record<string, unknown>>(
  data: T,
  fieldsToEncrypt: string[]
): T => {
  const encrypted = { ...data };
  
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field] as string) as T[Extract<keyof T, string>];
    }
  }
  
  return encrypted;
};

/**
 * Decrypt an object with specific sensitive fields
 */
export const decryptFields = <T extends Record<string, unknown>>(
  data: T,
  fieldsToDecrypt: string[]
): T => {
  const decrypted = { ...data };
  
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decrypt(decrypted[field] as string) as T[Extract<keyof T, string>];
    }
  }
  
  return decrypted;
};

/**
 * Try to decrypt a value - returns original if not encrypted or decryption fails
 * Used for handling data that may or may not be encrypted (backwards compatibility)
 */
export const tryDecrypt = (value: string): string => {
  if (!value) return value;
  
  // Check if it looks encrypted (CryptoJS format: base64 string)
  const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(value.trim());
  
  if (!isBase64) {
    // Not encrypted format, return as-is
    return value;
  }
  
  const decrypted = decrypt(value);
  // If decryption returns same value, it wasn't actually encrypted
  return decrypted === value ? value : decrypted;
};