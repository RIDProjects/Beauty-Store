"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryDecrypt = exports.decryptFields = exports.encryptFields = exports.decrypt = exports.encrypt = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
// La clave debe coincidir con la del frontend (usar la misma variable de entorno)
const getEncryptionKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY is not defined in environment variables');
    }
    return key;
};
/**
 * Encripta datos sensibles — compatible con CryptoJS del frontend
 */
const encrypt = (plainText) => {
    if (!plainText)
        return plainText;
    return crypto_js_1.default.AES.encrypt(plainText, getEncryptionKey()).toString();
};
exports.encrypt = encrypt;
/**
 * Desencripta datos sensibles — compatible con CryptoJS.AES.encrypt() del frontend
 */
const decrypt = (encryptedData) => {
    if (!encryptedData)
        return encryptedData;
    try {
        const bytes = crypto_js_1.default.AES.decrypt(encryptedData, getEncryptionKey());
        return bytes.toString(crypto_js_1.default.enc.Utf8);
    }
    catch {
        // Si no se puede desencriptar, devolver el original (backwards compatibility)
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
    // Check if it looks encrypted (CryptoJS format: base64 string starting with "U2FsdGVkX1")
    if (!value.startsWith('U2FsdGVkX1')) {
        // Not encrypted format, return as-is
        return value;
    }
    const decrypted = (0, exports.decrypt)(value);
    // If decryption returns empty or same value, it wasn't actually encrypted
    return decrypted === value || decrypted === '' ? value : decrypted;
};
exports.tryDecrypt = tryDecrypt;
//# sourceMappingURL=encryption.js.map