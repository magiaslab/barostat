import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import {
  claimsFromIdToken,
  isAllowedGoogleProfile,
  readWorkspaceDomain,
} from "@/lib/auth-domain";

/** Trenta giorni: la palestra è spesso senza rete. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          hd: readWorkspaceDomain(),
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile, user, account }) {
      const domain = readWorkspaceDomain();
      const merged: Record<string, unknown> = {
        ...user,
        ...profile,
        ...claimsFromIdToken(account?.id_token),
      };
      const allowed = isAllowedGoogleProfile(merged, domain);
      if (!allowed) {
        const email =
          typeof merged.email === "string" ? merged.email.toLowerCase() : "";
        console.info("[auth] accesso rifiutato", {
          domainSet: Boolean(domain),
          domainLength: domain?.length ?? 0,
          hasEmail: Boolean(email),
          emailHost: email.split("@")[1] ?? "",
          hd: typeof merged.hd === "string" ? "present" : "absent",
          unverified: merged.email_verified === false,
        });
      }
      return allowed;
    },
    authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      if (
        path.startsWith("/login") ||
        path.startsWith("/api/auth") ||
        // La rotta risponde 401 in JSON: un redirect HTML romperebbe la coda.
        path.startsWith("/api/sync") ||
        path === "/sw.js"
      ) {
        return true;
      }
      return !!session?.user;
    },
  },
} satisfies NextAuthConfig;
