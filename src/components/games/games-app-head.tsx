import { auth } from "@/auth";

import { GamesSyncPill } from "@/components/games/games-sync-pill";
import { SignOutButton } from "@/components/games/sign-out-button";

export async function GamesAppHead() {
  const session = await auth();
  const name = session?.user?.name?.trim() || "Staff";
  const first = name.split(/\s+/)[0] ?? name;
  const picture = session?.user?.image;
  const letters = initials(name);

  return (
    <div className="apphead">
      <div className="who">
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="av" src={picture} alt="" />
        ) : (
          <span className="av av-f2">{letters}</span>
        )}
        <div className="who-text">
          <span className="who-name">{first}</span>
          {session?.user?.email ? (
            <span className="who-meta">{session.user.email}</span>
          ) : null}
        </div>
      </div>
      <div className="head-tools">
        <GamesSyncPill />
        <SignOutButton />
      </div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return (parts[0] ?? "?").slice(0, 2).toUpperCase();
}
