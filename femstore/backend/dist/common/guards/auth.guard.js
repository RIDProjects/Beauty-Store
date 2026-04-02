"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const helpers_1 = require("../helpers");
// Obtener JWT_SECRET - lanzar error si no existe en producción
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET no está configurado. Configure la variable de entorno JWT_SECRET.');
        }
        console.warn('⚠️ JWT_SECRET no configurado. Usando clave por defecto (NO seguro para producción).');
        return 'dev-secret-key-do-not-use-in-production';
    }
    return secret;
};
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        (0, helpers_1.sendError)(res, 'Token de autenticación requerido', 401);
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, getJwtSecret());
        req.user = payload;
        next();
    }
    catch {
        (0, helpers_1.sendError)(res, 'Token inválido o expirado', 401);
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, helpers_1.sendError)(res, 'No autenticado', 401);
            return;
        }
        if (!roles.includes(req.user.role)) {
            (0, helpers_1.sendError)(res, 'No tienes permisos para realizar esta acción', 403);
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const optionalAuth = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const payload = jsonwebtoken_1.default.verify(token, getJwtSecret());
            req.user = payload;
        }
        catch {
            // Token invalid but optional, continue
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.guard.js.map