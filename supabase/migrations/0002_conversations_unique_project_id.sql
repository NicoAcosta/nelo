-- Add unique constraint on conversations.project_id to enable upsert
-- Each project has exactly one conversation row
CREATE UNIQUE INDEX conversations_project_id_unique ON conversations(project_id);
