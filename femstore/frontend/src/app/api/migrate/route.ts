import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// POST /api/migrate - Run database migrations (admin only)
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

    // SQL de migración completo
    const migrations = [
      // Extensión UUID
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

      // Tabla users
      `CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabla categories
      `CREATE TABLE IF NOT EXISTS public.categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabla products
      `CREATE TABLE IF NOT EXISTS public.products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
        stock INTEGER DEFAULT 0 CHECK (stock >= 0),
        sales_count INTEGER DEFAULT 0 CHECK (sales_count >= 0),
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabla product_images
      `CREATE TABLE IF NOT EXISTS public.product_images (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        url VARCHAR(500) NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabla orders
      `CREATE TABLE IF NOT EXISTS public.orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_number VARCHAR(20) UNIQUE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(255),
        delivery_address TEXT,
        delivery_type VARCHAR(20) DEFAULT 'pickup' CHECK (delivery_type IN ('pickup', 'delivery')),
        notes TEXT,
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
        whatsapp_sent BOOLEAN DEFAULT FALSE,
        whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabla order_items
      `CREATE TABLE IF NOT EXISTS public.order_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(200) NOT NULL,
        product_price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        subtotal DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Índices
      `CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id)`,
      `CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug)`,
      `CREATE INDEX IF NOT EXISTS idx_products_sales ON public.products(sales_count DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status)`,
      `CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id)`,
      `CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email)`,
    ];

    // Ejecutar cada migración
    for (const sql of migrations) {
      await query(sql);
    }

    // Seed de datos básicos
    const seedResults = [];

    // Seed admin user
    try {
      await query(
        `INSERT INTO public.users (name, email, password, role) VALUES 
         ('Admin Vainy Bliss', 'admin@vainybliss.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewpbfG/zVFovOqsy', 'admin')
         ON CONFLICT (email) DO NOTHING`
      );
      seedResults.push('Admin user');
    } catch (e) { /* ignore */ }

    // Seed categories
    try {
      await query(
        `INSERT INTO public.categories (name, slug, description) VALUES
         ('Ropa', 'ropa', 'Vestidos, blusas, pantalones y más'),
         ('Accesorios', 'accesorios', 'Bisutería, bolsos y complementos'),
         ('Belleza', 'belleza', 'Maquillaje, skincare y cuidado personal'),
         ('Zapatos', 'zapatos', 'Sandalias, tacones, sneakers y más'),
         ('Bolsos', 'bolsos', 'Carteras, mochilas, tote bags y clutches')
         ON CONFLICT (slug) DO NOTHING`
      );
      seedResults.push('Categories');
    } catch (e) { /* ignore */ }

    return NextResponse.json({ 
      success: true, 
      message: 'Migración ejecutada correctamente',
      created: ['Tables', 'Indexes', ...seedResults]
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message || 'Error en la migración' 
    }, { status: 500 });
  }
}

// GET /api/migrate - Check migration status
export async function GET() {
  try {
    const tables = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    return NextResponse.json({ 
      success: true, 
      tables: tables.rows.map(r => r.table_name)
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}