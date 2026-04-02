import { Pool } from 'pg';

const getDbConfig = () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    return { connectionString };
  }
  
  return {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
};

// Create pool lazily to handle serverless environment
let pool: Pool | null = null;
let migrationsRun = false;

const getPool = () => {
  if (!pool) {
    pool = new Pool(getDbConfig());
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
};

// Auto-migration on first query
export const query = async (text: string, params?: unknown[]) => {
  // Run migrations if not done yet
  if (!migrationsRun) {
    await runMigrations();
    migrationsRun = true;
  }
  
  const pool = getPool();
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
  }
  
  return res;
};

export const getClient = async () => {
  // Ensure migrations run before getting client
  if (!migrationsRun) {
    await runMigrations();
    migrationsRun = true;
  }
  const pool = getPool();
  return pool.connect();
};

// Auto-run migrations
async function runMigrations() {
  console.log('🔄 Checking database migrations...');
  
  try {
    const pool = getPool();
    
    // 1. Enable UUID extension
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // 2. Create tables (IF NOT EXISTS to avoid errors)
    const tables = [
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
      
      `CREATE TABLE IF NOT EXISTS public.product_images (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        url VARCHAR(500) NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
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
    ];
    
    for (const sql of tables) {
      await pool.query(sql);
    }
    
    // 3. Create indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id)`,
      `CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug)`,
      `CREATE INDEX IF NOT EXISTS idx_products_sales ON public.products(sales_count DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status)`,
      `CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email)`,
    ];
    
    for (const sql of indexes) {
      try { await pool.query(sql); } catch {}
    }
    
    // 4. Seed data
    await pool.query(`
      INSERT INTO public.users (name, email, password, role) VALUES 
      ('Admin Vainy Bliss', 'admin@vainybliss.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewpbfG/zVFovOqsy', 'admin')
      ON CONFLICT (email) DO NOTHING
    `);
    
    await pool.query(`
      INSERT INTO public.categories (name, slug, description) VALUES
      ('Ropa', 'ropa', 'Vestidos, blusas, pantalones y más'),
      ('Accesorios', 'accesorios', 'Bisutería, bolsos y complementos'),
      ('Belleza', 'belleza', 'Maquillaje, skincare y cuidado personal'),
      ('Zapatos', 'zapatos', 'Sandalias, tacones, sneakers y más'),
      ('Bolsos', 'bolsos', 'Carteras, mochilas, tote bags y clutches')
      ON CONFLICT (slug) DO NOTHING
    `);
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    // Don't throw - let the app continue, migrations might fail on existing tables
  }
}

export default { query, getClient };