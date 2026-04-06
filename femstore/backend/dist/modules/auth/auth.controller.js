"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("./auth.service");
const auth_guard_1 = require("../../common/guards/auth.guard");
const helpers_1 = require("../../common/helpers");
const validators_1 = require("../../common/validators");
const decryptBody_1 = require("../../common/middleware/decryptBody");
const router = (0, express_1.Router)();
const authService = new auth_service_1.AuthService();
// POST /api/auth/register
router.post('/register', (0, decryptBody_1.decryptBody)('email', 'password', 'phone'), async (req, res) => {
    const validation = (0, validators_1.validateRequestSafe)(validators_1.RegisterSchema, req.body);
    if (!validation.success) {
        const errors = validation.error.issues.map(issue => issue.message).join(', ');
        return (0, helpers_1.sendError)(res, errors);
    }
    const { name, email, password, phone } = validation.data;
    try {
        const result = await authService.register({ name, email, password, phone });
        return (0, helpers_1.sendSuccess)(res, result, 'Registro exitoso', 201);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
// POST /api/auth/login
router.post('/login', (0, decryptBody_1.decryptBody)('email', 'password'), async (req, res) => {
    const validation = (0, validators_1.validateRequestSafe)(validators_1.LoginSchema, req.body);
    if (!validation.success) {
        const errors = validation.error.issues.map(issue => issue.message).join(', ');
        return (0, helpers_1.sendError)(res, errors);
    }
    const { email, password } = validation.data;
    try {
        const result = await authService.login({ email, password });
        return (0, helpers_1.sendSuccess)(res, result, 'Login exitoso');
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message, 401);
    }
});
// GET /api/auth/me
router.get('/me', auth_guard_1.authenticate, async (req, res) => {
    try {
        const user = await authService.getProfile(req.user.sub);
        return (0, helpers_1.sendSuccess)(res, user);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message, 404);
    }
});
// PUT /api/auth/profile
router.put('/profile', auth_guard_1.authenticate, async (req, res) => {
    const validation = (0, validators_1.validateRequestSafe)(validators_1.UpdateProfileSchema, req.body);
    if (!validation.success) {
        const errors = validation.error.issues.map(issue => issue.message).join(', ');
        return (0, helpers_1.sendError)(res, errors);
    }
    try {
        const user = await authService.updateProfile(req.user.sub, validation.data);
        return (0, helpers_1.sendSuccess)(res, user, 'Perfil actualizado');
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=auth.controller.js.map