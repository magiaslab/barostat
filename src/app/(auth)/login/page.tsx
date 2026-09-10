import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { WORKSPACE_DOMAIN } from "@/lib/auth-domain";

export const metadata: Metadata = { title: "Accesso" };

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user) redirect("/games");

  const { error } = await searchParams;
  const denied = error === "AccessDenied" || error === "Configuration";

  return (
    <div className="login-screen">
      <div className="wrap">
        <div className="login-box">
          <div>
            <div className="mark" aria-hidden>
              <i />
              <i />
              <i />
            </div>
            <h1 className="t login-title">BaroStat 24</h1>
            <p className="tag">I ventiquattro secondi, otto per volta.</p>
          </div>

          <div>
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/games" });
              }}
            >
              <button type="submit" className="gbtn">
                <GoogleMark />
                Accedi con Google
              </button>
            </form>
            {error ? (
              <p className="login-error" role="alert">
                {denied
                  ? WORKSPACE_DOMAIN
                    ? `Serve un account Google verificato del dominio ${WORKSPACE_DOMAIN}.`
                    : "Questo account non è autorizzato."
                  : "Accesso non riuscito."}
              </p>
            ) : null}
            <p className="muted login-note">
              Accesso riservato allo staff. Nessuna password da ricordare a
              bordo campo: l&apos;account Google che usate già è sufficiente, e
              la sessione resta valida anche in palestra senza rete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.8 2.6 13.6l7.8 6c1.9-5.7 7.2-10.1 13.6-10.1z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.2 7-17.4z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.8-6C1 16.7 0 20.2 0 24s1 7.3 2.6 10.4l7.8-6z"
      />
      <path
        fill="#34A853"
        d="M24 47.5c6.2 0 11.5-2 15.3-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.7 2.3-6.4 0-11.7-4.4-13.6-10.1l-7.8 6C6.5 42.2 14.6 47.5 24 47.5z"
      />
    </svg>
  );
}
