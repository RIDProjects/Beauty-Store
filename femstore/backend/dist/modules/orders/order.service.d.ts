import { Order, OrderStatus, Pagination } from '../../common/types';
export interface CreateOrderDto {
    user_id?: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_address?: string;
    delivery_type: 'pickup' | 'delivery';
    notes?: string;
    items: {
        product_id: string;
        quantity: number;
    }[];
}
export interface OrderFilters {
    status?: OrderStatus;
    user_id?: string;
    page?: number;
    limit?: number;
}
export declare class OrderService {
    create(dto: CreateOrderDto): Promise<Order>;
    private sendWhatsAppNotification;
    findAll(filters?: OrderFilters): Promise<{
        orders: Order[];
        pagination: Pagination;
    }>;
    findById(id: string): Promise<Order | null>;
    updateStatus(id: string, status: OrderStatus): Promise<Order>;
    getStats(): Promise<{
        total_orders: number;
        pending_orders: number;
        total_revenue: number;
        today_orders: number;
    }>;
}
//# sourceMappingURL=order.service.d.ts.map