function normalizeDomain(domain: string | undefined): string | undefined {
  const trimmed = domain?.trim().replace(/^["']|["']$/g, "").toLowerCase();
  return trimmed || undefined;
}

export const WORKSPACE_DOMAIN = normalizeDomain(process.env.GOOGLE_WORKSPACE_DOMAIN);

function emailOf(profile: Record<string, unknown>): string {
  return typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
}

function isVerified(profile: Record<string, unknown>): boolean {
  return (
    profile.email_verified === true ||
    profile.email_verified === "true" ||
    profile.emailVerified === true ||
    profile.emailVerified instanceof Date
  );
}

function hostedDomain(profile: Record<string, unknown>): string {
  return typeof profile.hd === "string" ? profile.hd.trim().toLowerCase() : "";
}

export function isAllowedGoogleProfile(
  profile: unknown,
  domain: string | undefined = WORKSPACE_DOMAIN,
): boolean {
  const expected = normalizeDomain(domain);
  if (!expected) return false;
  if (typeof profile !== "object" || profile === null) return false;
  const rec = profile as Record<string, unknown>;
  if (!isVerified(rec)) return false;
  const hd = hostedDomain(rec);
  if (hd) return hd === expected;
  const email = emailOf(rec);
  return email.endsWith(`@${expected}`);
}
