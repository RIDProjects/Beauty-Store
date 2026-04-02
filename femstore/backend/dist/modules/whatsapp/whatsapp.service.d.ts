import { Order } from '../../common/types';
export declare class WhatsAppService {
    private client;
    constructor();
    private initializeClient;
    formatOrderMessage(order: Order): string;
    sendOrderNotification(order: Order): Promise<boolean>;
}
//# sourceMappingURL=whatsapp.service.d.ts.map