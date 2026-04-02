import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// GET /api/products/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await query(
      `SELECT 
        p.*,
        c.name AS category_name,
        (SELECT json_agg(pi ORDER BY pi.sort_order ASC) FROM product_images pi WHERE pi.product_id = p.id) AS images,
        (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE LIMIT 1) AS primary_image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener producto' }, { status: 500 });
  }
}

// PUT /api/products/[id] - Update product (admin only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET) as { role: string };

    if (payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, stock, category_id, is_active } = body;

    const result = await query(
      `UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        stock = COALESCE($4, stock),
        category_id = COALESCE($5, category_id),
        is_active = COALESCE($6, is_active),
        updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name || null, description || null, price || null, stock || null, category_id || null, is_active !== undefined ? is_active : null, params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0], message: 'Producto actualizado' });
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar producto' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Delete product (admin only)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET) as { role: string };

    if (payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    await query('DELETE FROM products WHERE id = $1', [params.id]);

    return NextResponse.json({ success: true, message: 'Producto eliminado' });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar producto' }, { status: 500 });
  }
}