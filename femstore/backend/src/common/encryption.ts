import crypto from 'crypto';

// Usar el mismo algoritmo que CryptoJS (AES-128-CBC con key derivada)
const ALGORITHM = 'aes-128-cbc';
const IV_LENGTH = 16;

// Get encryption key from environment - derive to 32 bytes (16 for key + 16 for IV)
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }
  // Derivar una clave de 32 bytes usando SHA-256
  return crypto.createHash('sha256').update(key).digest();
};

/**
 * Encrypts sensitive data - compatible with CryptoJS.AES
 * Returns: iv:encryptedData (hex)
 */
export const encrypt = (plainText: string): string => {
  if (!plainText) return plainText;
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Format: iv:ciphertext (both in hex)
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts sensitive data - compatible with CryptoJS.AES
 * Input format: iv:encryptedData (hex)
 */
export const decrypt = (encryptedData: string): string => {
  if (!encryptedData) return encryptedData;
  
  // Check if it's encrypted format (has colon separator)
  const parts = encryptedData.split(':');
  if (parts.length !== 2) {
    // Not encrypted format, return as-is (backwards compatibility)
    return encryptedData;
  }
  
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'hex');
    const ciphertext = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    // Return original if decryption fails
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
  
  // Check if it looks encrypted (3 parts separated by colons)
  const parts = value.split(':');
  if (parts.length !== 3) {
    return value; // Not encrypted format
  }
  
  const decrypted = decrypt(value);
  // If decryption returns same value, it wasn't actually encrypted
  return decrypted === value ? value : decrypted;
};