import { query } from '../../config/database';
import { Product, Pagination } from '../../common/types';
import { slugify, paginate } from '../../common/helpers';

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  sale_price?: number | null;
  is_on_sale?: boolean;
  stock?: number;
  category_id?: string;
  is_active?: boolean;
}

export interface ProductFilters {
  category_id?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ProductsResult {
  products: Product[];
  pagination: Pagination;
}

// Unidades comprometidas en pedidos activos (no cancelados ni entregados).
// El stock físico solo se descuenta al entregar; "available" es lo vendible online.
const RESERVED_SQL = `COALESCE((
  SELECT SUM(oi.quantity)::int
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.product_id = p.id
    AND o.status NOT IN ('cancelled', 'delivered', 'completed')
), 0)`;

export class ProductService {
  async findAll(filters: ProductFilters = {}): Promise<ProductsResult> {
    const { page, limit, offset } = paginate(filters.page, filters.limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (filters.is_active !== undefined) {
      conditions.push(`p.is_active = $${paramIdx++}`);
      params.push(filters.is_active);
    }

    if (filters.category_id) {
      conditions.push(`p.category_id = $${paramIdx++}`);
      params.push(filters.category_id);
    }

    if (filters.search) {
      conditions.push(`(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`);
      params.push(`%${filters.search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Order by - support sort=sales for most sold products
    let orderBy = 'p.created_at DESC';
    if (filters.sort === 'sales') {
      orderBy = 'p.sales_count DESC NULLS LAST';
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM products p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const productsResult = await query(
      `SELECT
        p.*,
        c.name AS category_name,
        ${RESERVED_SQL} AS reserved,
        GREATEST(0, p.stock - ${RESERVED_SQL}) AS available,
        (
          SELECT json_agg(pi ORDER BY pi.sort_order ASC)
          FROM product_images pi
          WHERE pi.product_id = p.id
        ) AS images,
        (
          SELECT pi.url FROM product_images pi
          WHERE pi.product_id = p.id AND pi.is_primary = TRUE
          LIMIT 1
        ) AS primary_image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    return {
      products: productsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Product | null> {
    const result = await query(
      `SELECT
        p.*,
        c.name AS category_name,
        ${RESERVED_SQL} AS reserved,
        GREATEST(0, p.stock - ${RESERVED_SQL}) AS available,
        (
          SELECT json_agg(pi ORDER BY pi.sort_order ASC)
          FROM product_images pi
          WHERE pi.product_id = p.id
        ) AS images,
        (
          SELECT pi.url FROM product_images pi
          WHERE pi.product_id = p.id AND pi.is_primary = TRUE
          LIMIT 1
        ) AS primary_image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const slug = slugify(dto.name);

    const result = await query(
      `INSERT INTO products (name, slug, description, price, sale_price, is_on_sale, stock, category_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        dto.name,
        slug,
        dto.description || null,
        dto.price,
        dto.sale_price ?? null,
        dto.is_on_sale ?? false,
        dto.stock ?? 0,
        dto.category_id || null,
        dto.is_active ?? true,
      ]
    );

    return result.rows[0];
  }

  async update(id: string, dto: Partial<CreateProductDto>): Promise<Product> {
    const product = await this.findById(id);
    if (!product) throw new Error('Producto no encontrado');

    const result = await query(
      `UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        sale_price = $4,
        is_on_sale = COALESCE($5, is_on_sale),
        stock = COALESCE($6, stock),
        category_id = COALESCE($7, category_id),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        dto.name || null,
        dto.description !== undefined ? dto.description : null,
        dto.price || null,
        dto.sale_price !== undefined ? dto.sale_price : null,
        dto.is_on_sale !== undefined ? dto.is_on_sale : null,
        dto.stock !== undefined ? dto.stock : null,
        dto.category_id || null,
        dto.is_active !== undefined ? dto.is_active : null,
        id,
      ]
    );

    return result.rows[0];
  }

  async toggleActive(id: string): Promise<Product> {
    const result = await query(
      `UPDATE products SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) throw new Error('Producto no encontrado');
    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    const result = await query('DELETE FROM products WHERE id = $1', [id]);
    if (result.rowCount === 0) throw new Error('Producto no encontrado');
  }

  async addImage(productId: string, url: string, isPrimary = false): Promise<void> {
    // If setting as primary, unset others first
    if (isPrimary) {
      await query(
        'UPDATE product_images SET is_primary = FALSE WHERE product_id = $1',
        [productId]
      );
    }

    // Check if product has no images yet - make first one primary
    const countResult = await query(
      'SELECT COUNT(*) FROM product_images WHERE product_id = $1',
      [productId]
    );
    const count = parseInt(countResult.rows[0].count);

    await query(
      `INSERT INTO product_images (product_id, url, is_primary, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [productId, url, isPrimary || count === 0, count]
    );
  }

  async removeImage(imageId: string): Promise<void> {
    await query('DELETE FROM product_images WHERE id = $1', [imageId]);
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    await query(
      'UPDATE product_images SET is_primary = FALSE WHERE product_id = $1',
      [productId]
    );
    await query(
      'UPDATE product_images SET is_primary = TRUE WHERE id = $1',
      [imageId]
    );
  }
}
