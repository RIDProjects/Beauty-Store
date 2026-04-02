import { z } from 'zod';
export declare const RegisterSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const UpdateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateProductSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    stock: z.ZodOptional<z.ZodNumber>;
    category_id: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const UpdateProductSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    price: z.ZodOptional<z.ZodNumber>;
    stock: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    category_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    is_active: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const CreateOrderItemSchema: z.ZodObject<{
    product_id: z.ZodString;
    quantity: z.ZodNumber;
}, z.core.$strip>;
export declare const CreateOrderSchema: z.ZodObject<{
    customer_name: z.ZodString;
    customer_phone: z.ZodString;
    customer_email: z.ZodOptional<z.ZodString>;
    delivery_type: z.ZodEnum<{
        pickup: "pickup";
        delivery: "delivery";
    }>;
    delivery_address: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        product_id: z.ZodString;
        quantity: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const CreateCategorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    image_url: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const validateRequest: <T>(schema: z.ZodSchema<T>, data: unknown) => T;
export declare const validateRequestSafe: <T>(schema: z.ZodSchema<T>, data: unknown) => z.ZodSafeParseResult<T>;
//# sourceMappingURL=validators.d.ts.map