"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressService = void 0;
const database_1 = require("../../config/database");
class AddressService {
    async findByUser(userId) {
        const result = await (0, database_1.query)(`SELECT * FROM customer_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`, [userId]);
        return result.rows;
    }
    async create(userId, label, address, makeDefault) {
        if (makeDefault) {
            await (0, database_1.query)(`UPDATE customer_addresses SET is_default = FALSE WHERE user_id = $1`, [userId]);
        }
        // If this is the first address, auto-set as default
        const countResult = await (0, database_1.query)(`SELECT COUNT(*) FROM customer_addresses WHERE user_id = $1`, [userId]);
        const isFirst = parseInt(countResult.rows[0].count) === 0;
        const result = await (0, database_1.query)(`INSERT INTO customer_addresses (user_id, label, address, is_default)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [userId, label, address, makeDefault || isFirst]);
        return result.rows[0];
    }
    async setDefault(userId, addressId) {
        await (0, database_1.query)(`UPDATE customer_addresses SET is_default = FALSE WHERE user_id = $1`, [userId]);
        const result = await (0, database_1.query)(`UPDATE customer_addresses SET is_default = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`, [addressId, userId]);
        if (result.rows.length === 0)
            throw new Error('Dirección no encontrada');
        return result.rows[0];
    }
    async delete(userId, addressId) {
        await (0, database_1.query)(`DELETE FROM customer_addresses WHERE id = $1 AND user_id = $2`, [addressId, userId]);
    }
}
exports.AddressService = AddressService;
//# sourceMappingURL=address.service.js.map