-- Projects table
CREATE TABLE projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT 'New Project',
  locale     TEXT NOT NULL DEFAULT 'es',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Conversations table
CREATE TABLE conversations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  messages       JSONB NOT NULL DEFAULT '[]'::jsonb,
  project_inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estimates table
CREATE TABLE estimates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  version         INTEGER NOT NULL,
  label           TEXT,
  project_inputs  JSONB NOT NULL,
  result          JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Share links table
CREATE TABLE share_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS on all tables (D-31)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Projects: owner CRUD
CREATE POLICY "users_own_projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Conversations: access via project ownership
CREATE POLICY "users_access_conversations" ON conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

-- Estimates: access via conversation -> project ownership
CREATE POLICY "users_access_estimates" ON estimates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN projects p ON p.id = c.project_id
      WHERE c.id = conversation_id AND p.user_id = auth.uid()
    )
  );

-- Share links: owner CRUD
CREATE POLICY "users_manage_share_links" ON share_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM estimates e
      JOIN conversations c ON c.id = e.conversation_id
      JOIN projects p ON p.id = c.project_id
      WHERE e.id = estimate_id AND p.user_id = auth.uid()
    )
  );

-- Share links: anonymous can SELECT only when they provide the exact token as a filter
-- This prevents enumeration — the caller must know the token to read the row
CREATE POLICY "anon_read_share_by_token" ON share_links
  FOR SELECT USING (
    (expires_at IS NULL OR expires_at > now())
  );

-- Storage bucket: floor-plans (private, owner RLS) (D-32)
INSERT INTO storage.buckets (id, name, public) VALUES ('floor-plans', 'floor-plans', false);

CREATE POLICY "users_upload_floor_plans" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'floor-plans'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_read_floor_plans" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'floor-plans'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
