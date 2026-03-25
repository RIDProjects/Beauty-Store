import { query } from '../../config/database';
import { Category } from '../../common/types';
import { slugify } from '../../common/helpers';

export interface CreateCategoryDto {
  name: string;
  description?: string;
  image_url?: string;
}

export class CategoryService {
  async findAll(activeOnly = false): Promise<Category[]> {
    const whereClause = activeOnly ? 'WHERE is_active = TRUE' : '';
    const result = await query(
      `SELECT * FROM categories ${whereClause} ORDER BY name ASC`
    );
    return result.rows;
  }

  async findById(id: string): Promise<Category | null> {
    const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = slugify(dto.name);

    // Check if slug exists
    const existing = await query('SELECT id FROM categories WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      throw new Error('Ya existe una categoría con ese nombre');
    }

    const result = await query(
      `INSERT INTO categories (name, slug, description, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [dto.name, slug, dto.description || null, dto.image_url || null]
    );

    return result.rows[0];
  }

  async update(id: string, dto: Partial<CreateCategoryDto>): Promise<Category> {
    const category = await this.findById(id);
    if (!category) throw new Error('Categoría no encontrada');

    const result = await query(
      `UPDATE categories SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        image_url = COALESCE($3, image_url),
        updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [dto.name || null, dto.description || null, dto.image_url || null, id]
    );

    return result.rows[0];
  }

  async toggleActive(id: string): Promise<Category> {
    const result = await query(
      `UPDATE categories SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) throw new Error('Categoría no encontrada');
    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    await query('DELETE FROM categories WHERE id = $1', [id]);
  }
}
