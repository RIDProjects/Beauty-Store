import { query, getClient } from '../../config/database';
import { Order, OrderStatus, Pagination } from '../../common/types';
import { generateOrderNumber, paginate } from '../../common/helpers';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { encrypt, decrypt } from '../../common/encryption';

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

// Helper para desencriptar datos que pueden venir encriptados desde el frontend
const tryDecrypt = (value: string | undefined): string | undefined => {
  if (!value) return value;
  // Intentar desencriptar - si falla, devolver el valor original
  const decrypted = decrypt(value);
  return decrypted === value ? value : decrypted; // Si es igual, no estaba encriptado
};

export interface OrderFilters {
  status?: OrderStatus;
  user_id?: string;
  page?: number;
  limit?: number;
}

const whatsappService = new WhatsAppService();

export class OrderService {
  async create(dto: CreateOrderDto): Promise<Order> {
    const client = await getClient();

    // Desencriptar datos que vienen del frontend (si están encriptados)
    const decryptedPhone = tryDecrypt(dto.customer_phone) || dto.customer_phone;
    const decryptedEmail = dto.customer_email ? (tryDecrypt(dto.customer_email) || dto.customer_email) : undefined;
    const decryptedAddress = dto.delivery_address ? (tryDecrypt(dto.delivery_address) || dto.delivery_address) : undefined;
    const decryptedNotes = dto.notes ? (tryDecrypt(dto.notes) || dto.notes) : undefined;

    try {
      await client.query('BEGIN');

      // Validate products and calculate totals
      let subtotal = 0;
      const resolvedItems: {
        product_id: string;
        product_name: string;
        product_price: number;
        quantity: number;
        subtotal: number;
      }[] = [];

      for (const item of dto.items) {
        const productResult = await client.query(
          'SELECT id, name, price, stock, is_active FROM products WHERE id = $1',
          [item.product_id]
        );

        if (productResult.rows.length === 0) {
          throw new Error(`Producto no encontrado: ${item.product_id}`);
        }

        const product = productResult.rows[0];

        if (!product.is_active) {
          throw new Error(`El producto "${product.name}" no está disponible`);
        }

        if (item.quantity <= 0) {
          throw new Error(`Cantidad inválida para "${product.name}"`);
        }

        const itemSubtotal = parseFloat(product.price) * item.quantity;
        subtotal += itemSubtotal;

        resolvedItems.push({
          product_id: product.id,
          product_name: product.name,
          product_price: parseFloat(product.price),
          quantity: item.quantity,
          subtotal: itemSubtotal,
        });
      }

      const total = subtotal; // Extend here for shipping costs, discounts, etc.
      const orderNumber = generateOrderNumber();

      // Create order - encrypt sensitive fields (ya desencriptados del input)
      const encryptedPhone = encrypt(decryptedPhone);
      const encryptedEmail = decryptedEmail ? encrypt(decryptedEmail) : null;
      const encryptedAddress = decryptedAddress ? encrypt(decryptedAddress) : null;

      const orderResult = await client.query(
        `INSERT INTO orders (
          order_number, user_id, customer_name, customer_phone, customer_email,
          delivery_address, delivery_type, notes, subtotal, total, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
        RETURNING *`,
        [
          orderNumber,
          dto.user_id || null,
          dto.customer_name,
          encryptedPhone,
          encryptedEmail,
          encryptedAddress,
          dto.delivery_type,
          decryptedNotes || null,
          subtotal,
          total,
        ]
      );

      const order = orderResult.rows[0] as Order;

      // Create order items
      for (const item of resolvedItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.id, item.product_id, item.product_name, item.product_price, item.quantity, item.subtotal]
        );
      }

      await client.query('COMMIT');

      // Fetch complete order with items
      const completeOrder = await this.findById(order.id);
      if (!completeOrder) throw new Error('Error al recuperar la orden');

      // Send WhatsApp notification (non-blocking)
      // Note: Use the decrypted values from dto, not the stored encrypted ones
      const orderForWhatsapp = {
        ...completeOrder,
        customer_phone: decryptedPhone,
        customer_email: decryptedEmail,
        delivery_address: decryptedAddress,
      };
      this.sendWhatsAppNotification(orderForWhatsapp as Order);

      return completeOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async sendWhatsAppNotification(order: Order): Promise<void> {
    try {
      const sent = await whatsappService.sendOrderNotification(order);
      if (sent) {
        await query(
          `UPDATE orders SET whatsapp_sent = TRUE, whatsapp_sent_at = NOW() WHERE id = $1`,
          [order.id]
        );
      }
    } catch (error) {
      console.error('WhatsApp notification failed:', error);
    }
  }

  async findAll(filters: OrderFilters = {}): Promise<{ orders: Order[]; pagination: Pagination }> {
    const { page, limit, offset } = paginate(filters.page, filters.limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (filters.status) {
      conditions.push(`o.status = $${paramIdx++}`);
      params.push(filters.status);
    }

    if (filters.user_id) {
      conditions.push(`o.user_id = $${paramIdx++}`);
      params.push(filters.user_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM orders o ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const ordersResult = await query(
      `SELECT o.* FROM orders o ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    // Decrypt sensitive fields for each order
    const orders = (ordersResult.rows as Order[]).map((order) => ({
      ...order,
      customer_phone: decrypt(order.customer_phone),
      customer_email: order.customer_email ? decrypt(order.customer_email) : undefined,
      delivery_address: order.delivery_address ? decrypt(order.delivery_address) : undefined,
    }));

    // Fetch items for each order
    for (const order of orders) {
      const itemsResult = await query(
        'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC',
        [order.id]
      );
      order.items = itemsResult.rows;
    }

    return {
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<Order | null> {
    const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;

    const order = result.rows[0] as Order;
    
    // Decrypt sensitive fields
    order.customer_phone = decrypt(order.customer_phone);
    order.customer_email = order.customer_email ? decrypt(order.customer_email) : undefined;
    order.delivery_address = order.delivery_address ? decrypt(order.delivery_address) : undefined;

    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC',
      [id]
    );
    order.items = itemsResult.rows;

    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const client = await getClient();
    const outOfStockProducts: { name: string; id: string }[] = [];

    try {
      await client.query('BEGIN');

      // Atomic status update — only proceeds if not already completed (prevents double-deduct)
      const result = await client.query(
        `UPDATE orders SET status = $1, updated_at = NOW()
         WHERE id = $2 AND ($1 != 'completed' OR status != 'completed')
         RETURNING *`,
        [status, id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('Orden no encontrada o ya está completada');
      }

      if (status === 'completed') {
        const itemsResult = await client.query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [id]
        );

        for (const item of itemsResult.rows) {
          const stockResult = await client.query(
            `UPDATE products SET
              stock = GREATEST(0, stock - $1),
              sales_count = sales_count + $1
             WHERE id = $2
             RETURNING name, stock`,
            [item.quantity, item.product_id]
          );

          const updated = stockResult.rows[0];
          if (updated && parseInt(updated.stock, 10) === 0) {
            outOfStockProducts.push({ name: updated.name, id: item.product_id });
          }
        }
      }

      await client.query('COMMIT');

      const order = result.rows[0] as Order;
      order.customer_phone = decrypt(order.customer_phone);
      order.customer_email = order.customer_email ? decrypt(order.customer_email) : undefined;
      order.delivery_address = order.delivery_address ? decrypt(order.delivery_address) : undefined;

      const itemsResult = await query('SELECT * FROM order_items WHERE order_id = $1', [id]);
      order.items = itemsResult.rows;

      // Non-blocking WhatsApp notification after commit
      if (outOfStockProducts.length > 0) {
        whatsappService.sendOutOfStockNotification(outOfStockProducts).catch(() => {});
      }

      return order;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getStats(): Promise<{
    total_orders: number;
    pending_orders: number;
    total_revenue: number;
    today_orders: number;
    week_orders: number;
    month_orders: number;
    out_of_stock: number;
    total_products: number;
    total_products_value: number;
    total_units_sold: number;
    total_sold_revenue: number;
    chart_data: { date: string; count: number }[];
  }> {
    const [statsResult, outOfStockResult, chartResult, productStatsResult, soldRevenueResult] = await Promise.all([
      query(`
        SELECT
          COUNT(*)                                                              AS total_orders,
          COUNT(*) FILTER (WHERE status = 'pending')                           AS pending_orders,
          COALESCE(SUM(total) FILTER (WHERE status != 'cancelled'), 0)         AS total_revenue,
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)              AS today_orders,
          COUNT(*) FILTER (WHERE created_at >= date_trunc('week', NOW()))      AS week_orders,
          COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))     AS month_orders
        FROM orders
      `),
      query(`SELECT COUNT(*) AS out_of_stock FROM products WHERE stock = 0 AND is_active = TRUE`),
      query(`
        SELECT
          TO_CHAR(gs.day, 'YYYY-MM-DD') AS date,
          COALESCE(COUNT(o.id), 0)       AS count
        FROM generate_series(
          CURRENT_DATE - INTERVAL '29 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        ) AS gs(day)
        LEFT JOIN orders o
          ON DATE(o.created_at) = gs.day
          AND o.status != 'cancelled'
        GROUP BY gs.day
        ORDER BY gs.day ASC
      `),
      query(`
        SELECT
          COUNT(*) AS total_products,
          COALESCE(SUM(price), 0) AS total_products_value,
          COALESCE(SUM(sales_count), 0) AS total_units_sold
        FROM products
        WHERE is_active = TRUE
      `),
      query(`
        SELECT COALESCE(SUM(o.total), 0) AS total_sold_revenue
        FROM orders o
        WHERE o.status = 'completed'
      `),
    ]);

    return {
      ...statsResult.rows[0],
      out_of_stock: parseInt(outOfStockResult.rows[0].out_of_stock),
      total_products: parseInt(productStatsResult.rows[0].total_products),
      total_products_value: parseFloat(productStatsResult.rows[0].total_products_value),
      total_units_sold: parseInt(productStatsResult.rows[0].total_units_sold),
      total_sold_revenue: parseFloat(soldRevenueResult.rows[0].total_sold_revenue),
      chart_data: chartResult.rows.map((r) => ({ date: r.date, count: parseInt(r.count) })),
    };
  }
}
