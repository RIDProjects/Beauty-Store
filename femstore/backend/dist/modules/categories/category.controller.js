"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_service_1 = require("./category.service");
const auth_guard_1 = require("../../common/guards/auth.guard");
const helpers_1 = require("../../common/helpers");
const router = (0, express_1.Router)();
const categoryService = new category_service_1.CategoryService();
// GET /api/categories - Public
router.get('/', async (_req, res) => {
    try {
        const categories = await categoryService.findAll(true);
        return (0, helpers_1.sendSuccess)(res, categories);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message, 500);
    }
});
// GET /api/categories/admin - Admin only (includes inactive)
router.get('/admin', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (_req, res) => {
    try {
        const categories = await categoryService.findAll(false);
        return (0, helpers_1.sendSuccess)(res, categories);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message, 500);
    }
});
// POST /api/categories - Admin only
router.post('/', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (req, res) => {
    const { name, description, image_url } = req.body;
    if (!name)
        return (0, helpers_1.sendError)(res, 'El nombre es requerido');
    try {
        const category = await categoryService.create({ name, description, image_url });
        return (0, helpers_1.sendSuccess)(res, category, 'Categoría creada', 201);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
// PUT /api/categories/:id - Admin only
router.put('/:id', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (req, res) => {
    try {
        const category = await categoryService.update(req.params.id, req.body);
        return (0, helpers_1.sendSuccess)(res, category, 'Categoría actualizada');
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
// PATCH /api/categories/:id/toggle - Admin only
router.patch('/:id/toggle', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (req, res) => {
    try {
        const category = await categoryService.toggleActive(req.params.id);
        return (0, helpers_1.sendSuccess)(res, category, 'Estado actualizado');
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
// DELETE /api/categories/:id - Admin only
router.delete('/:id', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (req, res) => {
    try {
        await categoryService.delete(req.params.id);
        return (0, helpers_1.sendSuccess)(res, null, 'Categoría eliminada');
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=category.controller.js.map