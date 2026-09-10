export const WORKSPACE_DOMAIN = process.env.GOOGLE_WORKSPACE_DOMAIN;

export function isAllowedGoogleProfile(
  profile: unknown,
  domain: string | undefined = WORKSPACE_DOMAIN,
): boolean {
  if (!domain) return false;
  if (typeof profile !== "object" || profile === null) return false;
  const rec = profile as Record<string, unknown>;
  return rec.email_verified === true && rec.hd === domain;
}
