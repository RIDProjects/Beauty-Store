"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const address_service_1 = require("./address.service");
const auth_guard_1 = require("../../common/guards/auth.guard");
const helpers_1 = require("../../common/helpers");
const router = (0, express_1.Router)();
const addressService = new address_service_1.AddressService();
// All routes require authentication
router.use(auth_guard_1.authenticate);
// GET /api/addresses — list user's addresses
router.get('/', async (req, res) => {
    try {
        const addresses = await addressService.findByUser(req.user.sub);
        return (0, helpers_1.sendSuccess)(res, addresses);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message, 500);
    }
});
// POST /api/addresses — create address
router.post('/', async (req, res) => {
    const { label, address, is_default } = req.body;
    if (!address || !address.trim()) {
        return (0, helpers_1.sendError)(res, 'La dirección es requerida');
    }
    try {
        const created = await addressService.create(req.user.sub, label?.trim() || 'Mi dirección', address.trim(), is_default === true || is_default === 'true');
        return (0, helpers_1.sendSuccess)(res, created, 'Dirección guardada', 201);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
// PATCH /api/addresses/:id/default — set as default
router.patch('/:id/default', async (req, res) => {
    try {
        const address = await addressService.setDefault(req.user.sub, req.params.id);
        return (0, helpers_1.sendSuccess)(res, address, 'Dirección predeterminada actualizada');
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
// DELETE /api/addresses/:id — delete address
router.delete('/:id', async (req, res) => {
    try {
        await addressService.delete(req.user.sub, req.params.id);
        return (0, helpers_1.sendSuccess)(res, null, 'Dirección eliminada');
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=address.controller.js.map