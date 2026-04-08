-- ==========================================
-- EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- USERS TABLE
-- ==========================================
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

-- ==========================================
-- CATEGORIES TABLE
-- ==========================================
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

-- ==========================================
-- PRODUCTS TABLE
-- ==========================================
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

-- ==========================================
-- PRODUCT IMAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.product_images (
                                                     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                                     product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                                                     url VARCHAR(500) NOT NULL,
                                                     is_primary BOOLEAN DEFAULT FALSE,
                                                     sort_order INTEGER DEFAULT 0,
                                                     created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ORDERS TABLE
-- ==========================================
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
                                                 CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
                                             whatsapp_sent BOOLEAN DEFAULT FALSE,
                                             whatsapp_sent_at TIMESTAMPTZ,
                                             created_at TIMESTAMPTZ DEFAULT NOW(),
                                             updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ORDER ITEMS TABLE
-- ==========================================
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

-- ==========================================
-- CUSTOMER ADDRESSES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.customer_addresses (
                                                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                         user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                                         label VARCHAR(100) NOT NULL DEFAULT 'Mi dirección',
                                                         address TEXT NOT NULL,
                                                         is_default BOOLEAN NOT NULL DEFAULT FALSE,
                                                         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sales ON public.products(sales_count DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
