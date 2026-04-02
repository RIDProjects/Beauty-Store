-- Add sales_count column to products table
-- Run this SQL on your Railway database

ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- Create index for sorting by sales
CREATE INDEX IF NOT EXISTS idx_products_sales ON products(sales_count DESC NULLS LAST);

-- Update existing products to have 0 sales
UPDATE products SET sales_count = 0 WHERE sales_count IS NULL;