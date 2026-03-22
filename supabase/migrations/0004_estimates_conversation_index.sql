-- 0004_estimates_conversation_index.sql
-- Index on estimates.conversation_id for query performance.
-- Note: idx_estimates_conversation_id was also included in 0003_postgres_audit_fixes.sql.
-- This migration uses IF NOT EXISTS to be idempotent on fresh installs.
CREATE INDEX IF NOT EXISTS idx_estimates_conversation_id ON estimates(conversation_id);
