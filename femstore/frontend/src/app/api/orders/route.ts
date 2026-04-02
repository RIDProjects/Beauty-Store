import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const createOrderSchema = z.object({
  customer_name: z.string().min(2),
  customer_phone: z.string().min(8),
  customer_email: z.string().email().optional(),
  delivery_type: z.enum(['pickup', 'delivery']),
  delivery_address: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
});

// POST /api/orders - Create order
export async function POST(request: Request) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const authHeader = request.headers.get('authorization');
    let userId: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
      userId = payload.sub;
    }

    const body = await request.json();
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map(i => i.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const { customer_name, customer_phone, customer_email, delivery_type, delivery_address, notes, items } = validation.data;

    if (delivery_type === 'delivery' && !delivery_address) {
      return NextResponse.json({ success: false, error: 'La dirección es requerida para entrega a domicilio' }, { status: 400 });
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const resolvedItems: {
      product_id: string;
      product_name: string;
      product_price: number;
      quantity: number;
      subtotal: number;
    }[] = [];

    for (const item of items) {
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

    const total = subtotal;
    const orderNumber = 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (
        order_number, user_id, customer_name, customer_phone, customer_email,
        delivery_address, delivery_type, notes, subtotal, total, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
       RETURNING *`,
      [orderNumber, userId || null, customer_name, customer_phone, customer_email || null, delivery_address || null, delivery_type, notes || null, subtotal, total]
    );

    const order = orderResult.rows[0];

    // Create order items and update sales count
    for (const item of resolvedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.product_id, item.product_name, item.product_price, item.quantity, item.subtotal]
      );

      await client.query(
        `UPDATE products SET sales_count = sales_count + $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');

    // Fetch complete order with items
    const completeOrderResult = await query(
      `SELECT o.*, 
        (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o WHERE o.id = $1`,
      [order.id]
    );

    return NextResponse.json({ success: true, data: completeOrderResult.rows[0], message: 'Pedido creado exitosamente' }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order create error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Error al crear pedido' }, { status: 400 });
  } finally {
    client.release();
  }
}

// GET /api/orders - Get orders
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    // If not admin, only show own orders
    if (payload.role !== 'admin') {
      conditions.push(`o.user_id = $${paramIdx++}`);
      params.push(payload.sub);
    }

    if (status) {
      conditions.push(`o.status = $${paramIdx++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countResult = await query(`SELECT COUNT(*) FROM orders o ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const ordersResult = await query(
      `SELECT o.*, 
        (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: ordersResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener pedidos' }, { status: 500 });
  }
}