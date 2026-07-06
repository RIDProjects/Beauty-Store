import { query } from '../config/database';

const MIGRATION_SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  sale_price DECIMAL(10,2),
  is_on_sale BOOLEAN NOT NULL DEFAULT FALSE,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  sales_count INTEGER DEFAULT 0 CHECK (sales_count >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
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
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'completed')),
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  whatsapp_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL DEFAULT 'Mi dirección',
  address TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sales ON products(sales_count DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id);
`;

// Statements with dollar-quoting that can't be split by semicolon
const FUNCTION_SQL = `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
`;

const TRIGGER_STATEMENTS = [
  `DROP TRIGGER IF EXISTS update_users_updated_at ON users`,
  `CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
  `DROP TRIGGER IF EXISTS update_categories_updated_at ON categories`,
  `CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
  `DROP TRIGGER IF EXISTS update_products_updated_at ON products`,
  `CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
  `DROP TRIGGER IF EXISTS update_orders_updated_at ON orders`,
  `CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
];

// Alter statements for columns/constraints added after initial deploy
const ALTER_STATEMENTS = [
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0`,
  `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check`,
  `ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'completed'))`,
];

function maskDbUrl(url: string | undefined): string {
  if (!url) return 'undefined';
  try {
    const match = url.match(/:\/\/([^:]+):([^@]+)@/);
    if (match) return url.replace(match[2], '****');
  } catch {}
  return url;
}

// Split SQL by semicolons but NOT inside $$...$$ dollar-quoted blocks
function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;

  while (i < sql.length) {
    if (!inDollarQuote && sql[i] === '$') {
      const tagMatch = sql.slice(i).match(/^\$([^$]*)\$/);
      if (tagMatch) {
        inDollarQuote = true;
        dollarTag = tagMatch[0];
        current += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }

    if (inDollarQuote && sql[i] === '$') {
      const tagMatch = sql.slice(i).match(/^\$([^$]*)\$/);
      if (tagMatch && tagMatch[0] === dollarTag) {
        inDollarQuote = false;
        dollarTag = '';
        current += tagMatch[0];
        i += tagMatch[0].length;
        continue;
      }
    }

    if (sql[i] === ';' && !inDollarQuote) {
      const trimmed = current.trim();
      if (trimmed && !trimmed.startsWith('--')) statements.push(trimmed);
      current = '';
      i++;
      continue;
    }

    current += sql[i];
    i++;
  }

  const trimmed = current.trim();
  if (trimmed && !trimmed.startsWith('--')) statements.push(trimmed);
  return statements;
}

async function runStatement(stmt: string, label?: string): Promise<'ok' | 'skip' | 'error'> {
  const type = stmt.match(/^(CREATE TABLE|CREATE INDEX|CREATE EXTENSION|CREATE TRIGGER|DROP TRIGGER|CREATE OR REPLACE|ALTER TABLE)/i)?.[1]?.toUpperCase() || 'STMT';
  const display = label || `${stmt.substring(0, 50).replace(/\n/g, ' ')}...`;
  try {
    await query(stmt);
    console.log(`  ✅ ${type}: ${display}`);
    return 'ok';
  } catch (err: any) {
    if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
      console.log(`  ⏭️  ${type}: already exists`);
      return 'skip';
    }
    console.log(`  ❌ ${type}: ${err.message?.substring(0, 100) || 'Unknown error'}`);
    return 'error';
  }
}

async function runMigrations() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_DEPLOYMENT_ID;

  console.log('\n🗄️  DATABASE MIGRATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Environment: ${isProduction ? 'PRODUCTION (Railway)' : 'development'}`);
  console.log(`🔗 Database URL: ${maskDbUrl(process.env.DATABASE_URL)}`);
  console.log(`🔄 Running migrations...\n`);

  let ok = 0, skip = 0, err = 0;

  const track = (r: 'ok' | 'skip' | 'error') => {
    if (r === 'ok') ok++;
    else if (r === 'skip') skip++;
    else err++;
  };

  await query('SELECT 1');
  console.log('✅ Database connection successful\n');

  // Main DDL statements
  for (const stmt of splitStatements(MIGRATION_SQL)) {
    track(await runStatement(stmt));
  }

  // Alter statements (idempotent column/constraint additions)
  console.log('\n  📦 Applying schema updates...');
  for (const stmt of ALTER_STATEMENTS) {
    track(await runStatement(stmt));
  }

  // Function (dollar-quoted, kept separate)
  track(await runStatement(FUNCTION_SQL, 'update_updated_at_column()'));

  // Triggers (idempotent via DROP IF EXISTS)
  for (const stmt of TRIGGER_STATEMENTS) {
    track(await runStatement(stmt));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Migration Summary: ${ok} ok, ${skip} skipped, ${err} errors`);
  if (err > 0) console.log('⚠️  Some statements failed — check above for details');
  console.log('✅ Database ready\n');
}

runMigrations().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
