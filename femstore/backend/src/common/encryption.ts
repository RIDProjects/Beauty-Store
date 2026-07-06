import CryptoJS from 'crypto-js';

// La clave debe coincidir con la del frontend (usar la misma variable de entorno)
const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }
  return key;
};

/**
 * Encripta datos sensibles — compatible con CryptoJS del frontend
 */
export const encrypt = (plainText: string): string => {
  if (!plainText) return plainText;
  return CryptoJS.AES.encrypt(plainText, getEncryptionKey()).toString();
};

/**
 * Desencripta datos sensibles — compatible con CryptoJS.AES.encrypt() del frontend
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
 * Try to decrypt a value - returns original if not encrypted or decryption fails
 * Used for handling data that may or may not be encrypted (backwards compatibility)
 */
export const tryDecrypt = (value: string): string => {
  if (!value) return value;
  
  // Check if it looks encrypted (CryptoJS format: base64 string starting with "U2FsdGVkX1")
  if (!value.startsWith('U2FsdGVkX1')) {
    // Not encrypted format, return as-is
    return value;
  }
  
  const decrypted = decrypt(value);
  // If decryption returns empty or same value, it wasn't actually encrypted
  return decrypted === value || decrypted === '' ? value : decrypted;
};