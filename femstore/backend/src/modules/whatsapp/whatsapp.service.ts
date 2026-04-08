import { Order } from '../../common/types';

export class WhatsAppService {
  private client: {
    messages: {
      create: (opts: { from: string; to: string; body: string }) => Promise<{ sid: string }>;
    };
  } | null = null;

  constructor() {
  }


  formatOrderMessage(order: Order): string {
    const itemsList = order.items
      ?.map((item) => `  • ${item.product_name} x${item.quantity} = $${item.subtotal.toFixed(2)}`)
      .join('\n');

    const deliveryInfo =
      order.delivery_type === 'delivery'
        ? `A domicilio\n📍 Dirección: ${order.delivery_address || 'No especificada'}`
        : '🏪 Retiro en tienda';

    const notes = order.notes ? `\n📝 Notas: ${order.notes}` : '';

    return (
      `🛍️ *NUEVO PEDIDO - FemStore*\n` +
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
      `⏰ ${new Date(order.created_at).toLocaleString('es-ES')}`
    );
  }

  async sendOrderNotification(order: Order): Promise<boolean> {
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
    } catch (error) {
      console.error('❌ Error sending WhatsApp:', error);
      return false;
    }
  }
}
