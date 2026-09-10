function normalizeDomain(domain: string | undefined): string | undefined {
  const trimmed = domain?.trim().replace(/^["']|["']$/g, "").toLowerCase();
  return trimmed || undefined;
}

/** Lettura a richiesta: in build Next può inlinare `process.env.X` a `undefined` se la var è un Secret. */
export function readWorkspaceDomain(
  raw: string | undefined = process.env["GOOGLE_WORKSPACE_DOMAIN"],
): string | undefined {
  return normalizeDomain(raw);
}

export const WORKSPACE_DOMAIN = readWorkspaceDomain();

function emailOf(profile: Record<string, unknown>): string {
  return typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
}

function isExplicitlyUnverified(profile: Record<string, unknown>): boolean {
  return (
    profile.email_verified === false ||
    profile.email_verified === "false" ||
    profile.emailVerified === false
  );
}

function hostedDomain(profile: Record<string, unknown>): string {
  return typeof profile.hd === "string" ? profile.hd.trim().toLowerCase() : "";
}

/** Payload dell'id_token Google già verificato da Auth.js: email, email_verified, hd. */
export function claimsFromIdToken(
  idToken: string | undefined,
): Record<string, unknown> {
  if (!idToken) return {};
  const payload = idToken.split(".")[1];
  if (!payload) return {};
  try {
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    const parsed: unknown = JSON.parse(json);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function isAllowedGoogleProfile(
  profile: unknown,
  domain: string | undefined = readWorkspaceDomain(),
): boolean {
  const expected = normalizeDomain(domain);
  if (!expected) return false;
  if (typeof profile !== "object" || profile === null) return false;
  const rec = profile as Record<string, unknown>;
  if (isExplicitlyUnverified(rec)) return false;
  const email = emailOf(rec);
  if (email.endsWith(`@${expected}`)) return true;
  return hostedDomain(rec) === expected;
}
