import { query } from '../../config/database';

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string;
  address: string;
  is_default: boolean;
  created_at: string;
}

export class AddressService {
  async findByUser(userId: string): Promise<CustomerAddress[]> {
    const result = await query(
      `SELECT * FROM customer_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async create(userId: string, label: string, address: string, makeDefault: boolean): Promise<CustomerAddress> {
    if (makeDefault) {
      await query(
        `UPDATE customer_addresses SET is_default = FALSE WHERE user_id = $1`,
        [userId]
      );
    }

    // If this is the first address, auto-set as default
    const countResult = await query(
      `SELECT COUNT(*) FROM customer_addresses WHERE user_id = $1`,
      [userId]
    );
    const isFirst = parseInt(countResult.rows[0].count) === 0;

    const result = await query(
      `INSERT INTO customer_addresses (user_id, label, address, is_default)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, label, address, makeDefault || isFirst]
    );
    return result.rows[0];
  }

  async setDefault(userId: string, addressId: string): Promise<CustomerAddress> {
    await query(
      `UPDATE customer_addresses SET is_default = FALSE WHERE user_id = $1`,
      [userId]
    );
    const result = await query(
      `UPDATE customer_addresses SET is_default = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
      [addressId, userId]
    );
    if (result.rows.length === 0) throw new Error('Dirección no encontrada');
    return result.rows[0];
  }

  async delete(userId: string, addressId: string): Promise<void> {
    await query(
      `DELETE FROM customer_addresses WHERE id = $1 AND user_id = $2`,
      [addressId, userId]
    );
  }
}
