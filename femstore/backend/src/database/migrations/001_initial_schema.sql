-- FemStore Database Schema
-- Run this file to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ==========================================
-- TRIGGERS: updated_at auto-update
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- SEED DATA
-- ==========================================

-- ==========================================
-- SEED DATA: Users, Categories, Products
-- ==========================================

-- Admin user (password: Admin123!)
INSERT INTO public.users (name, email, password, role) VALUES
  ('Admin Vainy Bliss', 'admin@vainybliss.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewpbfG/zVFovOqsy', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Test customer user (password: Customer123!)
INSERT INTO public.users (name, email, password, role) VALUES
  ('Maria Rodriguez', 'maria@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewpbfG/zVFovOqsy', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Default categories
INSERT INTO public.categories (name, slug, description, image_url) VALUES
  ('Ropa', 'ropa', 'Vestidos, blusas, pantalones y más', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400'),
  ('Accesorios', 'accesorios', 'Bisutería, bolsos y complementos', 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?w=400'),
  ('Belleza', 'belleza', 'Maquillaje, skincare y cuidado personal', 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?w=400'),
  ('Zapatos', 'zapatos', 'Sandalias, tacones, sneakers y más', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400'),
  ('Bolsos', 'bolsos', 'Carteras, mochilas, tote bags y clutches', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400')
ON CONFLICT (slug) DO NOTHING;

-- Products with images
INSERT INTO public.products (name, slug, description, price, stock, category_id, is_active) VALUES
  ('Vestido Floral Verde', 'vestido-floral-verde', 'Vestido midi con estampado floral en tonos verdes. Perfecto para ocasiones especiales.', 45.99, 25, (SELECT id FROM categories WHERE slug = 'ropa'), true),
  ('Blusa Eucalipto', 'blusa-eucalipto', 'Blusa de seda en color verde eucalipto. Diseño elegante y versátil.', 32.50, 40, (SELECT id FROM categories WHERE slug = 'ropa'), true),
  ('Pantalón Verde Oliva', 'pantalon-verde-oliva', 'Pantalón cargo en verde oliva. Cómodo y moderno.', 38.00, 30, (SELECT id FROM categories WHERE slug = 'ropa'), true),
  ('Collar Hoja Verde', 'collar-hoja-verde', 'Collar delicado con diseño de hoja en tono verde esmeralda.', 18.99, 60, (SELECT id FROM categories WHERE slug = 'accesorios'), true),
  ('Bolso Verde Bosque', 'bolso-verde-bosque', 'Bolso de mano en verde bosque con detalles dorados.', 55.00, 15, (SELECT id FROM categories WHERE slug = 'bolsos'), true),
  ('Sombra Verde Militar', 'sombra-verde-militar', 'Paleta de sombras en tonos verde militar. 12 colores mate y shimmer.', 24.99, 50, (SELECT id FROM categories WHERE slug = 'belleza'), true),
  ('Sandalias Verde Menta', 'sandalias-verde-menta', 'Sandalias planas en verde menta con tiras cruzadas.', 29.99, 35, (SELECT id FROM categories WHERE slug = 'zapatos'), true),
  ('Labial Verde Agua', 'labial-verde-agua', 'Labial hidratante con finish glossy en tono verde agua único.', 15.50, 80, (SELECT id FROM categories WHERE slug = 'belleza'), true),
  ('Mochila Verde Militar', 'mochila-verde-militar', 'Mochila urbana en verde militar. Múltiples compartimentos.', 62.00, 20, (SELECT id FROM categories WHERE slug = 'bolsos'), true),
  ('Bracelet Jade', 'bracelet-jade', 'Bracelet de cuentas de jade natural. Ajustable.', 22.00, 45, (SELECT id FROM categories WHERE slug = 'accesorios'), true)
ON CONFLICT (slug) DO NOTHING;

-- Product images
INSERT INTO public.product_images (product_id, url, is_primary, sort_order)
SELECT id,
  CASE
    WHEN slug = 'vestido-floral-verde' THEN 'https://images.unsplash.com/photo-1595777447586-9136f4c0f8d3?w=600'
    WHEN slug = 'blusa-eucalipto' THEN 'https://images.unsplash.com/photo-1564257641192-2c0f0095c9f8?w=600'
    WHEN slug = 'pantalon-verde-oliva' THEN 'https://images.unsplash.com/photo-1509319117193-518da720e86f?w=600'
    WHEN slug = 'collar-hoja-verde' THEN 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?w=600'
    WHEN slug = 'bolso-verde-bosque' THEN 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600'
    WHEN slug = 'sombra-verde-militar' THEN 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?w=600'
    WHEN slug = 'sandalias-verde-menta' THEN 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'
    WHEN slug = 'labial-verde-agua' THEN 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'
    WHEN slug = 'mochila-verde-militar' THEN 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'
    WHEN slug = 'bracelet-jade' THEN 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?w=600'
  END,
  true, 0
FROM public.products
ON CONFLICT DO NOTHING;
