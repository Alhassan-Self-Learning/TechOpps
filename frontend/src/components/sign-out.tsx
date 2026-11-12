import { connection } from "next/server";
import { LogOut } from "lucide-react";

import { logout } from "@/app/login/actions";
import { authEnabled } from "@/lib/session";

/** Shown only when login is enabled. Reads the environment at request time, not build time,
 *  so the pre-rendered shell matches what the server renders. */
export async function SignOut() {
  await connection();
  if (!authEnabled()) return null;
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <LogOut className="size-4" aria-hidden />
        Sign out
      </button>
    </form>
  );
}
