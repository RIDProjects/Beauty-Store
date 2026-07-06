import CryptoJS from 'crypto-js';

// La clave debe coincidir con la del backend (usar variable de entorno)
// Para desarrollo: mismo valor que ENCRYPTION_KEY en backend
const getEncryptionKey = (): string => {
  const key = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_ENCRYPTION_KEY is not set');
  return key;
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

