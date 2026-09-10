import NextAuth from "next-auth";

import { authConfig, SESSION_MAX_AGE } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  jwt: { maxAge: SESSION_MAX_AGE },
});
