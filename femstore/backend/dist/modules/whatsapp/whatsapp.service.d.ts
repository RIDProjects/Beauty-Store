import { Order } from '../../common/types';
export declare class WhatsAppService {
    private client;
    constructor();
    formatOrderMessage(order: Order): string;
    sendOrderNotification(order: Order): Promise<boolean>;
}
//# sourceMappingURL=whatsapp.service.d.ts.map