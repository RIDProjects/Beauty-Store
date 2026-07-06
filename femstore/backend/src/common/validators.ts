import { z } from 'zod';

// ─── Auth Schemas ──────────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  phone: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});

// ─── Product Schemas ───────────────────────────────────────────────────────
export const CreateProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  price: z.number().positive('El precio debe ser positivo'),
  stock: z.number().int().min(0).optional(),
  category_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// ─── Order Schemas ─────────────────────────────────────────────────────────
export const CreateOrderItemSchema = z.object({
  product_id: z.string().uuid('ID de producto inválido'),
  quantity: z.number().int().positive('La cantidad debe ser al menos 1'),
});

export const CreateOrderSchema = z.object({
  customer_name: z.string().min(2, 'El nombre es requerido'),
  customer_phone: z.string().min(8, 'El teléfono es requerido'),
  customer_email: z.string().email().optional(),
  delivery_type: z.enum(['pickup', 'delivery']),
  delivery_address: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(CreateOrderItemSchema).min(1, 'El carrito no puede estar vacío'),
});

// ─── Category Schemas ──────────────────────────────────────────────────────
export const CreateCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
});

// ─── Validation Helper ───────────────────────────────────────────────────────
export const validateRequestSafe = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  return schema.safeParse(data);
};