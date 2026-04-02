import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// GET /api/products - List products
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sort = searchParams.get('sort');
    const is_active = searchParams.get('is_active');

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (is_active !== null) {
      conditions.push(`p.is_active = $${paramIdx++}`);
      params.push(is_active === 'true');
    }

    if (category_id) {
      conditions.push(`p.category_id = $${paramIdx++}`);
      params.push(category_id);
    }

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Order by
    let orderBy = 'p.created_at DESC';
    if (sort === 'sales') {
      orderBy = 'p.sales_count DESC NULLS LAST';
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM products p WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const productsResult = await query(
      `SELECT 
        p.*,
        c.name AS category_name,
        (SELECT json_agg(pi ORDER BY pi.sort_order ASC) FROM product_images pi WHERE pi.product_id = p.id) AS images,
        (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE LIMIT 1) AS primary_image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: productsResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener productos' }, { status: 500 });
  }
}

// POST /api/products - Create product (admin only)
export async function POST(request: Request) {
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

    if (!name || !price) {
      return NextResponse.json({ success: false, error: 'Nombre y precio son requeridos' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const result = await query(
      `INSERT INTO products (name, slug, description, price, stock, category_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, slug, description || null, price, stock || 0, category_id || null, is_active !== undefined ? is_active : true]
    );

    return NextResponse.json({ success: true, data: result.rows[0], message: 'Producto creado' }, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ success: false, error: 'Error al crear producto' }, { status: 500 });
  }
}