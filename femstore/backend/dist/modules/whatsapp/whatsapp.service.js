"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
class WhatsAppService {
    constructor() {
        this.client = null;
        this.initializeClient();
    }
    initializeClient() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (accountSid && authToken && accountSid.startsWith('AC')) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const twilio = require('twilio');
                this.client = twilio(accountSid, authToken);
                console.log('✅ WhatsApp service initialized (Twilio)');
            }
            catch (err) {
                console.warn('⚠️ Twilio not available, WhatsApp messages will be logged only');
            }
        }
        else {
            console.warn('⚠️ Twilio credentials not configured. WhatsApp notifications will be simulated.');
        }
    }
    formatOrderMessage(order) {
        const itemsList = order.items
            ?.map((item) => `  • ${item.product_name} x${item.quantity} = $${item.subtotal.toFixed(2)}`)
            .join('\n');
        const deliveryInfo = order.delivery_type === 'delivery'
            ? `A domicilio\n📍 Dirección: ${order.delivery_address || 'No especificada'}`
            : '🏪 Retiro en tienda';
        const notes = order.notes ? `\n📝 Notas: ${order.notes}` : '';
        return (`🛍️ *NUEVO PEDIDO - FemStore*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📋 *Orden:* #${order.order_number}\n` +
            `👤 *Cliente:* ${order.customer_name}\n` +
            `📱 *Teléfono:* ${order.customer_phone}\n` +
            `${order.customer_email ? `📧 *Email:* ${order.customer_email}\n` : ''}` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🛒 *Productos:*\n${itemsList}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `💰 *Total: $${order.total.toFixed(2)}*\n` +
            `🚚 *Entrega:* ${deliveryInfo}` +
            `${notes}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `⏰ ${new Date(order.created_at).toLocaleString('es-ES')}`);
    }
    async sendOrderNotification(order) {
        const message = this.formatOrderMessage(order);
        const vendorPhone = process.env.VENDOR_WHATSAPP;
        const fromPhone = process.env.TWILIO_WHATSAPP_FROM;
        if (!vendorPhone) {
            console.error('❌ VENDOR_WHATSAPP not configured');
            return false;
        }
        // Log message regardless
        console.log('\n📱 WhatsApp notification:');
        console.log('─'.repeat(50));
        console.log(message);
        console.log('─'.repeat(50));
        if (!this.client || !fromPhone) {
            console.warn('📵 WhatsApp simulated (Twilio not configured)');
            return true; // Return true to not block order creation
        }
        try {
            const result = await this.client.messages.create({
                from: fromPhone,
                to: vendorPhone,
                body: message,
            });
            console.log(`✅ WhatsApp sent! SID: ${result.sid}`);
            return true;
        }
        catch (error) {
            console.error('❌ Error sending WhatsApp:', error);
            return false;
        }
    }
}
exports.WhatsAppService = WhatsAppService;
//# sourceMappingURL=whatsapp.service.js.map