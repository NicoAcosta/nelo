-- 0003_postgres_audit_fixes.sql
-- Fixes from Supabase Postgres best-practices audit (2026-03-22)
--
-- C1: anon_read_share_by_token allows enumeration of all non-expired share links
-- C2: Missing indexes on estimates.conversation_id and share_links.estimate_id
-- H1: auth.uid() evaluated per-row in all RLS policies (wrap in subselect)
-- M1: (app-layer fix, not in this migration)
-- L1: conversations table missing created_at column

-- =============================================================================
-- C2: Add missing foreign key indexes
-- =============================================================================
CREATE INDEX idx_estimates_conversation_id ON estimates(conversation_id);
CREATE INDEX idx_share_links_estimate_id ON share_links(estimate_id);

-- =============================================================================
-- L1: Add created_at to conversations
-- =============================================================================
ALTER TABLE conversations ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- =============================================================================
-- H1 + C1: Recreate all RLS policies with (select auth.uid()) for performance
-- =============================================================================

-- projects: owner CRUD
DROP POLICY "users_own_projects" ON projects;
CREATE POLICY "users_own_projects" ON projects
  FOR ALL USING ((select auth.uid()) = user_id);

-- conversations: access via project ownership
DROP POLICY "users_access_conversations" ON conversations;
CREATE POLICY "users_access_conversations" ON conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = conversations.project_id
        AND projects.user_id = (select auth.uid())
    )
  );

-- estimates: access via conversation → project ownership
DROP POLICY "users_access_estimates" ON estimates;
CREATE POLICY "users_access_estimates" ON estimates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN projects p ON p.id = c.project_id
      WHERE c.id = estimates.conversation_id
        AND p.user_id = (select auth.uid())
    )
  );

-- share_links: owner CRUD
DROP POLICY "users_manage_share_links" ON share_links;
CREATE POLICY "users_manage_share_links" ON share_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM estimates e
      JOIN conversations c ON c.id = e.conversation_id
      JOIN projects p ON p.id = c.project_id
      WHERE e.id = share_links.estimate_id
        AND p.user_id = (select auth.uid())
    )
  );

-- C1: Replace permissive anon policy with security-definer function
-- The old policy allowed any anonymous user to enumerate all non-expired links.
-- Now anonymous users must call get_share_link(token) which only returns a match.
DROP POLICY "anon_read_share_by_token" ON share_links;

CREATE OR REPLACE FUNCTION public.get_share_link(share_token TEXT)
RETURNS TABLE (
  id UUID,
  estimate_id UUID,
  token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT sl.id, sl.estimate_id, sl.token, sl.expires_at, sl.created_at
  FROM public.share_links sl
  WHERE sl.token = share_token
    AND (sl.expires_at IS NULL OR sl.expires_at > now())
  LIMIT 1;
$$;

-- Grant execute to anon so unauthenticated users can look up shared links
GRANT EXECUTE ON FUNCTION public.get_share_link(TEXT) TO anon;

-- =============================================================================
-- H1: Fix storage policies (auth.uid() → (select auth.uid()))
-- =============================================================================
DROP POLICY "users_upload_floor_plans" ON storage.objects;
CREATE POLICY "users_upload_floor_plans" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'floor-plans'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY "users_read_floor_plans" ON storage.objects;
CREATE POLICY "users_read_floor_plans" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'floor-plans'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );
