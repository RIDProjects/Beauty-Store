"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryDecrypt = exports.decryptFields = exports.encryptFields = exports.decrypt = exports.encrypt = void 0;
const crypto_1 = __importDefault(require("crypto"));
// La clave debe coincidir con la del frontend (usar la misma variable de entorno)
const getEncryptionKey = () => {
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
const encrypt = (plainText) => {
    if (!plainText)
        return plainText;
    return crypto_1.default.createHash('sha256').update(getEncryptionKey()).digest('base64');
};
exports.encrypt = encrypt;
/**
 * Desencripta datos sensibles - compatible con CryptoJS.AES.encrypt()
 * El formato de CryptoJS es diferente:base64 ciphertext (no incluye IV separado)
 */
const decrypt = (encryptedData) => {
    if (!encryptedData)
        return encryptedData;
    // Verificar si parece estar encriptado por CryptoJS (formato base64 típico)
    // CryptoJS genera output en base64
    const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(encryptedData.trim());
    if (!isBase64 || encryptedData.includes(':')) {
        // No es formato encriptado, devolver como está
        return encryptedData;
    }
    try {
        // Usar la misma clave para desencriptar
        const key = crypto_1.default.createHash('sha256').update(getEncryptionKey()).digest();
        // CryptoJS usa AES-128-CBC con la clave derivada
        // El formato de CryptoJS es: ciphertext en base64
        const decipher = crypto_1.default.createDecipheriv('aes-128-cbc', key, Buffer.alloc(16, 0));
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('Decryption failed:', error);
        return encryptedData;
    }
};
exports.decrypt = decrypt;
/**
 * Encrypt an object with specific sensitive fields
 */
const encryptFields = (data, fieldsToEncrypt) => {
    const encrypted = { ...data };
    for (const field of fieldsToEncrypt) {
        if (encrypted[field] && typeof encrypted[field] === 'string') {
            encrypted[field] = (0, exports.encrypt)(encrypted[field]);
        }
    }
    return encrypted;
};
exports.encryptFields = encryptFields;
/**
 * Decrypt an object with specific sensitive fields
 */
const decryptFields = (data, fieldsToDecrypt) => {
    const decrypted = { ...data };
    for (const field of fieldsToDecrypt) {
        if (decrypted[field] && typeof decrypted[field] === 'string') {
            decrypted[field] = (0, exports.decrypt)(decrypted[field]);
        }
    }
    return decrypted;
};
exports.decryptFields = decryptFields;
/**
 * Try to decrypt a value - returns original if not encrypted or decryption fails
 * Used for handling data that may or may not be encrypted (backwards compatibility)
 */
const tryDecrypt = (value) => {
    if (!value)
        return value;
    // Check if it looks encrypted (CryptoJS format: base64 string)
    const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(value.trim());
    if (!isBase64) {
        // Not encrypted format, return as-is
        return value;
    }
    const decrypted = (0, exports.decrypt)(value);
    // If decryption returns same value, it wasn't actually encrypted
    return decrypted === value ? value : decrypted;
};
exports.tryDecrypt = tryDecrypt;
//# sourceMappingURL=encryption.js.map