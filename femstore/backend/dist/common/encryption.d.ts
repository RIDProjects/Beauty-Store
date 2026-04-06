/**
 * Encripta datos sensibles — compatible con CryptoJS del frontend
 */
export declare const encrypt: (plainText: string) => string;
/**
 * Desencripta datos sensibles — compatible con CryptoJS.AES.encrypt() del frontend
 */
export declare const decrypt: (encryptedData: string) => string;
/**
 * Encrypt an object with specific sensitive fields
 */
export declare const encryptFields: <T extends Record<string, unknown>>(data: T, fieldsToEncrypt: string[]) => Record<string, unknown>;
/**
 * Decrypt an object with specific sensitive fields
 */
export declare const decryptFields: <T extends Record<string, unknown>>(data: T, fieldsToDecrypt: string[]) => Record<string, unknown>;
/**
 * Try to decrypt a value - returns original if not encrypted or decryption fails
 * Used for handling data that may or may not be encrypted (backwards compatibility)
 */
export declare const tryDecrypt: (value: string) => string;
//# sourceMappingURL=encryption.d.ts.map