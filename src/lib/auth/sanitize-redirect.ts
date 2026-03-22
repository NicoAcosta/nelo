/**
 * Sanitize a redirect path to prevent open redirect attacks.
 * Only allows paths starting with "/" that don't start with "//" (protocol-relative URLs).
 */
export function sanitizeRedirect(raw: string, fallback = "/projects"): string {
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}
