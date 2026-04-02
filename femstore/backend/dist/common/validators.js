"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequestSafe = exports.validateRequest = exports.CreateCategorySchema = exports.CreateOrderSchema = exports.CreateOrderItemSchema = exports.UpdateProductSchema = exports.CreateProductSchema = exports.UpdateProfileSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
// ─── Auth Schemas ──────────────────────────────────────────────────────────
exports.RegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    phone: zod_1.z.string().optional(),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(1, 'La contraseña es requerida'),
});
exports.UpdateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    phone: zod_1.z.string().optional(),
});
// ─── Product Schemas ───────────────────────────────────────────────────────
exports.CreateProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive('El precio debe ser positivo'),
    stock: zod_1.z.number().int().min(0).optional(),
    category_id: zod_1.z.string().uuid().optional(),
    is_active: zod_1.z.boolean().optional(),
});
exports.UpdateProductSchema = exports.CreateProductSchema.partial();
// ─── Order Schemas ─────────────────────────────────────────────────────────
exports.CreateOrderItemSchema = zod_1.z.object({
    product_id: zod_1.z.string().uuid('ID de producto inválido'),
    quantity: zod_1.z.number().int().positive('La cantidad debe ser al menos 1'),
});
exports.CreateOrderSchema = zod_1.z.object({
    customer_name: zod_1.z.string().min(2, 'El nombre es requerido'),
    customer_phone: zod_1.z.string().min(8, 'El teléfono es requerido'),
    customer_email: zod_1.z.string().email().optional(),
    delivery_type: zod_1.z.enum(['pickup', 'delivery']),
    delivery_address: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    items: zod_1.z.array(exports.CreateOrderItemSchema).min(1, 'El carrito no puede estar vacío'),
});
// ─── Category Schemas ──────────────────────────────────────────────────────
exports.CreateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    description: zod_1.z.string().optional(),
    image_url: zod_1.z.string().url().optional(),
});
// ─── Validation Helper ───────────────────────────────────────────────────────
const validateRequest = (schema, data) => {
    return schema.parse(data);
};
exports.validateRequest = validateRequest;
const validateRequestSafe = (schema, data) => {
    return schema.safeParse(data);
};
exports.validateRequestSafe = validateRequestSafe;
//# sourceMappingURL=validators.js.map