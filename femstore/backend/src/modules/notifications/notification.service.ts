import { query } from '../../config/database';
import { Pagination } from '../../common/types';
import { paginate } from '../../common/helpers';

export type NotificationType = 'new_order' | 'out_of_stock' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  created_at: Date;
}

export interface NotificationFilters {
  unread_only?: boolean;
  page?: number;
  limit?: number;
}

export class NotificationService {
  async create(
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<Notification> {
    const result = await query(
      `INSERT INTO notifications (type, title, message, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [type, title, message, metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0];
  }

  async findAll(filters: NotificationFilters = {}): Promise<{ notifications: Notification[]; pagination: Pagination }> {
    const { page, limit, offset } = paginate(filters.page, filters.limit || 20);
    const where = filters.unread_only ? 'WHERE is_read = FALSE' : '';

    const [dataResult, countResult] = await Promise.all([
      query(`SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      query(`SELECT COUNT(*) AS total FROM notifications ${where}`),
    ]);

    const total = parseInt(countResult.rows[0].total, 10);
    return {
      notifications: dataResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async unreadCount(): Promise<number> {
    const result = await query('SELECT COUNT(*) AS count FROM notifications WHERE is_read = FALSE');
    return parseInt(result.rows[0].count, 10);
  }

  async markRead(id: string): Promise<Notification> {
    const result = await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) throw new Error('Notificación no encontrada');
    return result.rows[0];
  }

  async markAllRead(): Promise<number> {
    const result = await query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
    return result.rowCount ?? 0;
  }
}
