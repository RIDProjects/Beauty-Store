"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_service_1 = require("./order.service");
const auth_guard_1 = require("../../common/guards/auth.guard");
const helpers_1 = require("../../common/helpers");
const decryptBody_1 = require("../../common/middleware/decryptBody");
const router = (0, express_1.Router)();
const orderService = new order_service_1.OrderService();
const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
// POST /api/orders - Create order (optional auth)
router.post('/', auth_guard_1.optionalAuth, (0, decryptBody_1.decryptBody)('customer_name', 'customer_phone', 'customer_email', 'delivery_address', 'notes'), async (req, res) => {
    const { customer_name, customer_phone, customer_email, delivery_address, delivery_type, notes, items, } = req.body;
    if (!customer_name || !customer_phone) {
        return (0, helpers_1.sendError)(res, 'Nombre y teléfono del cliente son requeridos');
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        return (0, helpers_1.sendError)(res, 'El carrito no puede estar vacío');
    }
    for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity < 1) {
            return (0, helpers_1.sendError)(res, 'Datos de productos inválidos');
        }
    }
    if (delivery_type === 'delivery' && !delivery_address) {
        return (0, helpers_1.sendError)(res, 'La dirección es requerida para entrega a domicilio');
    }
    try {
        const order = await orderService.create({
            user_id: req.user?.sub,
            customer_name,
            customer_phone,
            customer_email,
            delivery_address,
            delivery_type: delivery_type || 'pickup',
            notes,
            items,
        });
        return (0, helpers_1.sendSuccess)(res, order, '¡Pedido creado exitosamente!', 201);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
// GET /api/orders/my - Get current user's orders
router.get('/my', auth_guard_1.authenticate, async (req, res) => {
    const { page, limit, status } = req.query;
    try {
        const result = await orderService.findAll({
            user_id: req.user.sub,
            status: status,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
        });
        return (0, helpers_1.sendSuccess)(res, result.orders, undefined, 200, result.pagination);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message, 500);
    }
});
// GET /api/orders/stats - Admin dashboard stats
router.get('/stats', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (_req, res) => {
    try {
        const stats = await orderService.getStats();
        return (0, helpers_1.sendSuccess)(res, stats);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message, 500);
    }
});
// GET /api/orders - Admin: get all orders
router.get('/', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (req, res) => {
    const { page, limit, status } = req.query;
    try {
        const result = await orderService.findAll({
            status: status,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
        return (0, helpers_1.sendSuccess)(res, result.orders, undefined, 200, result.pagination);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message, 500);
    }
});
// GET /api/orders/:id - Get order detail
router.get('/:id', auth_guard_1.authenticate, async (req, res) => {
    try {
        const order = await orderService.findById(req.params.id);
        if (!order)
            return (0, helpers_1.sendError)(res, 'Orden no encontrada', 404);
        // Customers can only see their own orders
        if (req.user.role !== 'admin' && order.user_id !== req.user.sub) {
            return (0, helpers_1.sendError)(res, 'No autorizado', 403);
        }
        return (0, helpers_1.sendSuccess)(res, order);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message, 500);
    }
});
// PATCH /api/orders/:id/status - Admin: update order status
router.patch('/:id/status', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (req, res) => {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
        return (0, helpers_1.sendError)(res, `Estado inválido. Valores válidos: ${VALID_STATUSES.join(', ')}`);
    }
    try {
        const order = await orderService.updateStatus(req.params.id, status);
        return (0, helpers_1.sendSuccess)(res, order, 'Estado actualizado');
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=order.controller.js.map