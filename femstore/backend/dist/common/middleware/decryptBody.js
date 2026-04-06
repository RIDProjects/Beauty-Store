"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptBody = void 0;
const encryption_1 = require("../encryption");
/**
 * Middleware que desencripta campos sensibles del body antes de la validación.
 * Se usa en endpoints que reciben datos encriptados desde el frontend.
 *
 * Uso:
 *   router.post('/register', decryptBody('name', 'email', 'phone', 'password'), handler);
 */
const decryptBody = (...fields) => {
    return (req, _res, next) => {
        if (!req.body || typeof req.body !== 'object') {
            return next();
        }
        for (const field of fields) {
            if (req.body[field] && typeof req.body[field] === 'string') {
                req.body[field] = (0, encryption_1.decrypt)(req.body[field]);
            }
        }
        next();
    };
};
exports.decryptBody = decryptBody;
//# sourceMappingURL=decryptBody.js.map