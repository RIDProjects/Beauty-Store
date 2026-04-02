"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptRequest = exports.decryptRequest = void 0;
const encryption_1 = require("../encryption");
// Campos sensibles que deben ser desencriptados en requests
const SENSITIVE_FIELDS_REQUEST = ['phone', 'email', 'name', 'address', 'delivery_address', 'password'];
// Campos sensibles que deben ser desencriptados en responses
const SENSITIVE_FIELDS_RESPONSE = ['phone', 'email', 'name', 'delivery_address'];
/**
 * Middleware para desencriptar campos sensibles del body en requests
 */
const decryptRequest = (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
        return next();
    }
    try {
        const decryptedBody = { ...req.body };
        for (const field of SENSITIVE_FIELDS_REQUEST) {
            if (decryptedBody[field] && typeof decryptedBody[field] === 'string') {
                decryptedBody[field] = (0, encryption_1.tryDecrypt)(decryptedBody[field]) || decryptedBody[field];
            }
        }
        req.body = decryptedBody;
    }
    catch (error) {
        console.error('Error decrypting request:', error);
    }
    next();
};
exports.decryptRequest = decryptRequest;
/**
 * Middleware para encriptar campos sensibles del body antes de guardar
 * Aplica solo a requests que van a modificar datos (POST, PUT, PATCH)
 */
const encryptRequest = (req, res, next) => {
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
                encryptedBody[field] = (0, encryption_1.encrypt)(encryptedBody[field]);
            }
        }
        req.body = encryptedBody;
    }
    catch (error) {
        console.error('Error encrypting request:', error);
    }
    next();
};
exports.encryptRequest = encryptRequest;
//# sourceMappingURL=encryption.middleware.js.map