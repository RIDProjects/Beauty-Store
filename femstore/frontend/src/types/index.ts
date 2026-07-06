export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
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
  category_name?: string;
  is_active: boolean;
  images?: ProductImage[];
  primary_image?: string;
  created_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type DeliveryType = 'pickup' | 'delivery';

export interface OrderItem {
  id: string;
  product_id?: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string;
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
  items?: OrderItem[];
  created_at: string;
  out_of_stock_products?: { id: string; name: string }[];
}

export type NotificationType = 'new_order' | 'out_of_stock' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  stock: number;
  primary_image?: string;
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

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string;
  address: string;
  is_default: boolean;
  created_at: string;
}

export interface CheckoutFormData {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_type: DeliveryType;
  delivery_address?: string;
  notes?: string;
}
