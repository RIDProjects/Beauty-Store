import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended 12 bytes
const AUTH_TAG_LENGTH = 16;

// Get encryption key from environment
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }
  // Ensure key is exactly 32 bytes for AES-256
  return crypto.createHash('sha256').update(key).digest();
};

/**
 * Encrypts sensitive data
 * Returns: iv:authTag:encryptedData (base64)
 */
export const encrypt = (plainText: string): string => {
  if (!plainText) return plainText;
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:ciphertext
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
};

/**
 * Decrypts sensitive data
 * Input format: iv:authTag:encryptedData (base64)
 */
export const decrypt = (encryptedData: string): string => {
  if (!encryptedData) return encryptedData;
  
  // Check if it's actually encrypted (contains colons and has 3 parts)
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    // Not encrypted format, return as-is (backwards compatibility)
    return encryptedData;
  }
  
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
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