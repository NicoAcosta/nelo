-- 0006_check_share_token.sql
-- Adds check_share_token(token) security-definer function.
-- Enables D-12: share page can distinguish expired from not-found.

CREATE OR REPLACE FUNCTION public.check_share_token(share_token TEXT)
RETURNS TABLE (token_exists BOOLEAN, token_expired BOOLEAN)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT
    EXISTS(SELECT 1 FROM public.share_links sl WHERE sl.token = share_token) AS token_exists,
    EXISTS(
      SELECT 1 FROM public.share_links sl
      WHERE sl.token = share_token
        AND sl.expires_at IS NOT NULL
        AND sl.expires_at <= now()
    ) AS token_expired;
$$;

GRANT EXECUTE ON FUNCTION public.check_share_token(TEXT) TO anon;
