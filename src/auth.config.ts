import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { isAllowedGoogleProfile, WORKSPACE_DOMAIN } from "@/lib/auth-domain";

/** Trenta giorni: la palestra è spesso senza rete. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      authorization: {
        params: {
          hd: WORKSPACE_DOMAIN,
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      return isAllowedGoogleProfile(profile, WORKSPACE_DOMAIN);
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
