/**
 * [模板] Fastify 业务 Service 模板
 *
 * 使用方式：复制到 apps/api/src/services/ 并重命名
 * 示例：apps/api/src/services/intentService.ts
 */

import { Pool } from 'pg';
import { AppError } from '../middleware/errorHandler';
import { Redis } from 'ioredis';

interface CreateItemInput {
  userId: string;
  name: string;
}

interface ItemRecord {
  id: string;
  user_id: string;
  name: string;
  status: string;
  created_at: Date;
}

export class ItemService {
  constructor(
    private db: Pool,
    private redis: Redis
  ) {}

  async create(input: CreateItemInput): Promise<ItemRecord> {
    const { userId, name } = input;

    const result = await this.db.query<ItemRecord>(
      `INSERT INTO items (user_id, name, status)
       VALUES ($1, $2, 'active')
       RETURNING *`,
      [userId, name]
    );

    const item = result.rows[0];

    // 失效相关缓存
    await this.redis.del(`items:user:${userId}`);

    return item;
  }

  async getById(id: string): Promise<ItemRecord> {
    const result = await this.db.query<ItemRecord>(
      'SELECT * FROM items WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('ITEM_NOT_FOUND', 'Item does not exist', 404);
    }

    return result.rows[0];
  }

  async list(params: {
    userId: string;
    page: number;
    limit: number;
  }): Promise<{ items: ItemRecord[]; total: number }> {
    const { userId, page, limit } = params;
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      this.db.query<ItemRecord>(
        `SELECT * FROM items
         WHERE user_id = $1 AND status = 'active'
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      this.db.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM items
         WHERE user_id = $1 AND status = 'active'`,
        [userId]
      ),
    ]);

    return {
      items: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }
}
