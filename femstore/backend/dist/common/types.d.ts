export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: 'customer' | 'admin';
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    sale_price?: number | null;
    is_on_sale: boolean;
    stock: number;
    category_id?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    category_name?: string;
    images?: ProductImage[];
    primary_image?: string;
}
export interface ProductImage {
    id: string;
    product_id: string;
    url: string;
    is_primary: boolean;
    sort_order: number;
    created_at: Date;
}
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type DeliveryType = 'pickup' | 'delivery';
export interface Order {
    id: string;
    order_number: string;
    user_id?: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_address?: string;
    delivery_type: DeliveryType;
    notes?: string;
    subtotal: number;
    total: number;
    status: OrderStatus;
    whatsapp_sent: boolean;
    whatsapp_sent_at?: Date;
    created_at: Date;
    updated_at: Date;
    items?: OrderItem[];
}
export interface OrderItem {
    id: string;
    order_id: string;
    product_id?: string;
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
    created_at: Date;
}
export interface CartItem {
    product_id: string;
    product_name: string;
    product_price: number;
    quantity: number;
    primary_image?: string;
}
export interface JwtPayload {
    sub: string;
    email: string;
    role: 'customer' | 'admin';
    iat?: number;
    exp?: number;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    pagination?: Pagination;
}
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
//# sourceMappingURL=types.d.ts.map