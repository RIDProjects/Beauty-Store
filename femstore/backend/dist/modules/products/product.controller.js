"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const product_service_1 = require("./product.service");
const auth_guard_1 = require("../../common/guards/auth.guard");
const helpers_1 = require("../../common/helpers");
const router = (0, express_1.Router)();
const productService = new product_service_1.ProductService();
// Configure multer for image uploads
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `product-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten imágenes (jpg, png, webp)'));
        }
    },
});
// GET /api/products - Public - with filters
router.get('/', async (req, res) => {
    const { category_id, search, page, limit, sort } = req.query;
    try {
        const result = await productService.findAll({
            category_id: category_id,
            search: search,
            is_active: true,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 12,
            sort: sort,
        });
        return (0, helpers_1.sendSuccess)(res, result.products, undefined, 200, result.pagination);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message, 500);
    }
});
// GET /api/products/admin - Admin - all products including inactive
router.get('/admin', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (req, res) => {
    const { category_id, search, page, limit, is_active } = req.query;
    try {
        const result = await productService.findAll({
            category_id: category_id,
            search: search,
            is_active: is_active !== undefined ? is_active === 'true' : undefined,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
        return (0, helpers_1.sendSuccess)(res, result.products, undefined, 200, result.pagination);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message, 500);
    }
});
// GET /api/products/:id - Public
router.get('/:id', async (req, res) => {
    try {
        const product = await productService.findById(req.params.id);
        if (!product || !product.is_active) {
            return (0, helpers_1.sendError)(res, 'Producto no encontrado', 404);
        }
        return (0, helpers_1.sendSuccess)(res, product);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message, 500);
    }
});
// POST /api/products - Admin
router.post('/', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (req, res) => {
    const { name, description, price, sale_price, is_on_sale, stock, category_id, is_active } = req.body;
    if (!name || !price) {
        return (0, helpers_1.sendError)(res, 'Nombre y precio son requeridos');
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return (0, helpers_1.sendError)(res, 'El precio debe ser un número positivo');
    }
    try {
        const product = await productService.create({
            name,
            description,
            price: parseFloat(price),
            sale_price: sale_price ? parseFloat(sale_price) : null,
            is_on_sale: is_on_sale === 'true' || is_on_sale === true,
            stock: stock ? parseInt(stock) : 0,
            category_id,
            is_active: is_active !== undefined ? is_active === 'true' || is_active === true : true,
        });
        return (0, helpers_1.sendSuccess)(res, product, 'Producto creado', 201);
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
// PUT /api/products/:id - Admin
router.put('/:id', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (req, res) => {
    const { name, description, price, sale_price, is_on_sale, stock, category_id, is_active } = req.body;
    try {
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (price !== undefined)
            updateData.price = parseFloat(price);
        if (sale_price !== undefined)
            updateData.sale_price = sale_price ? parseFloat(sale_price) : null;
        if (is_on_sale !== undefined)
            updateData.is_on_sale = is_on_sale === 'true' || is_on_sale === true;
        if (stock !== undefined)
            updateData.stock = parseInt(stock);
        if (category_id !== undefined)
            updateData.category_id = category_id;
        if (is_active !== undefined)
            updateData.is_active = is_active === 'true' || is_active === true;
        const product = await productService.update(req.params.id, updateData);
        return (0, helpers_1.sendSuccess)(res, product, 'Producto actualizado');
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
// PATCH /api/products/:id/toggle - Admin
router.patch('/:id/toggle', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (req, res) => {
    try {
        const product = await productService.toggleActive(req.params.id);
        return (0, helpers_1.sendSuccess)(res, product, 'Estado actualizado');
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
// DELETE /api/products/:id - Admin
router.delete('/:id', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (req, res) => {
    try {
        await productService.delete(req.params.id);
        return (0, helpers_1.sendSuccess)(res, null, 'Producto eliminado');
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
// POST /api/products/:id/images - Admin - Upload image
router.post('/:id/images', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), upload.single('image'), async (req, res) => {
    if (!req.file) {
        return (0, helpers_1.sendError)(res, 'No se subió ninguna imagen');
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const isPrimary = req.body.is_primary === 'true';
    try {
        await productService.addImage(req.params.id, imageUrl, isPrimary);
        const product = await productService.findById(req.params.id);
        return (0, helpers_1.sendSuccess)(res, { url: imageUrl, product }, 'Imagen subida', 201);
    }
    catch (error) {
        // Clean up uploaded file on error
        fs_1.default.unlinkSync(req.file.path);
        return (0, helpers_1.sendError)(res, error.message);
    }
});
// DELETE /api/products/:id/images/:imageId - Admin
router.delete('/:id/images/:imageId', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (req, res) => {
    try {
        await productService.removeImage(req.params.imageId);
        return (0, helpers_1.sendSuccess)(res, null, 'Imagen eliminada');
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
// PATCH /api/products/:id/images/:imageId/primary - Admin
router.patch('/:id/images/:imageId/primary', auth_guard_1.authenticate, (0, auth_guard_1.authorize)('admin'), async (req, res) => {
    try {
        await productService.setPrimaryImage(req.params.id, req.params.imageId);
        return (0, helpers_1.sendSuccess)(res, null, 'Imagen principal actualizada');
    }
    catch (error) {
        return (0, helpers_1.sendError)(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=product.controller.js.map