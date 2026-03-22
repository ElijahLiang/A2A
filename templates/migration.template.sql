-- [模板] 数据库 Migration 模板
--
-- 使用方式：复制到 apps/api/migrations/ 并重命名
-- 命名规则：YYYYMMDDHHMMSS_description.sql
-- 示例：20260321120000_create_intents_table.sql

-- ============================================================
-- UP: 正向迁移
-- ============================================================

-- migrate:up

CREATE TABLE IF NOT EXISTS table_name (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- TODO: 定义表字段
    name            VARCHAR(100) NOT NULL,
    data            JSONB NOT NULL DEFAULT '{}',

    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'deleted')),

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_table_name_user
    ON table_name(user_id)
    WHERE status = 'active';

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_table_name_updated_at
    BEFORE UPDATE ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- DOWN: 回滚迁移
-- ============================================================

-- migrate:down

DROP TRIGGER IF EXISTS trg_table_name_updated_at ON table_name;
DROP TABLE IF EXISTS table_name;
