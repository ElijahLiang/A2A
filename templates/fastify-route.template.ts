/**
 * [模板] Fastify 路由模板
 *
 * 使用方式：复制到 apps/api/src/routes/ 并重命名
 * 示例：apps/api/src/routes/intents.ts
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type, Static } from '@sinclair/typebox';

// ── Schema 定义 ──────────────────────────────────────────

const CreateItemBody = Type.Object({
  // TODO: 定义请求 body 字段
  name: Type.String({ minLength: 1, maxLength: 100 }),
});
type CreateItemBodyType = Static<typeof CreateItemBody>;

const ItemResponse = Type.Object({
  id: Type.String(),
  name: Type.String(),
  created_at: Type.String(),
});

const ListQuery = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
});

// ── Route Handler ────────────────────────────────────────

async function createHandler(
  request: FastifyRequest<{ Body: CreateItemBodyType }>,
  reply: FastifyReply
) {
  const { name } = request.body;
  const userId = request.user.id; // 从 auth 中间件注入

  // TODO: 调用 service 层
  // const item = await itemService.create({ name, userId });

  return reply.status(201).send({
    ok: true,
    data: {
      /* item */
    },
  });
}

async function listHandler(
  request: FastifyRequest<{ Querystring: Static<typeof ListQuery> }>,
  reply: FastifyReply
) {
  const { page = 1, limit = 20 } = request.query;
  const userId = request.user.id;

  // TODO: 调用 service 层
  // const items = await itemService.list({ userId, page, limit });

  return reply.send({
    ok: true,
    data: {
      items: [],
      pagination: { page, limit, total: 0 },
    },
  });
}

// ── Route 注册 ───────────────────────────────────────────

export default async function itemRoutes(app: FastifyInstance) {
  // 所有路由需要认证
  app.addHook('onRequest', app.authenticate);

  app.post(
    '/',
    {
      schema: {
        body: CreateItemBody,
        response: { 201: Type.Object({ ok: Type.Boolean(), data: ItemResponse }) },
      },
    },
    createHandler
  );

  app.get(
    '/',
    {
      schema: {
        querystring: ListQuery,
      },
    },
    listHandler
  );
}
