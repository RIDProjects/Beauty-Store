"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const database_1 = require("../../config/database");
const helpers_1 = require("../../common/helpers");
class CategoryService {
    async findAll(activeOnly = false) {
        const whereClause = activeOnly ? 'WHERE is_active = TRUE' : '';
        const result = await (0, database_1.query)(`SELECT * FROM categories ${whereClause} ORDER BY name ASC`);
        return result.rows;
    }
    async findById(id) {
        const result = await (0, database_1.query)('SELECT * FROM categories WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
    async create(dto) {
        const slug = (0, helpers_1.slugify)(dto.name);
        // Check if slug exists
        const existing = await (0, database_1.query)('SELECT id FROM categories WHERE slug = $1', [slug]);
        if (existing.rows.length > 0) {
            throw new Error('Ya existe una categoría con ese nombre');
        }
        const result = await (0, database_1.query)(`INSERT INTO categories (name, slug, description, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [dto.name, slug, dto.description || null, dto.image_url || null]);
        return result.rows[0];
    }
    async update(id, dto) {
        const category = await this.findById(id);
        if (!category)
            throw new Error('Categoría no encontrada');
        const result = await (0, database_1.query)(`UPDATE categories SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        image_url = COALESCE($3, image_url),
        updated_at = NOW()
       WHERE id = $4
       RETURNING *`, [dto.name || null, dto.description || null, dto.image_url || null, id]);
        return result.rows[0];
    }
    async toggleActive(id) {
        const result = await (0, database_1.query)(`UPDATE categories SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 RETURNING *`, [id]);
        if (result.rows.length === 0)
            throw new Error('Categoría no encontrada');
        return result.rows[0];
    }
    async delete(id) {
        await (0, database_1.query)('DELETE FROM categories WHERE id = $1', [id]);
    }
}
exports.CategoryService = CategoryService;
//# sourceMappingURL=category.service.js.map