"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis, Search } from "lucide-react";

import { AppearanceList } from "@/components/appearance/appearance-menu";
import { UnreadBadge } from "@/components/notifications/unread-badge";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { openPalette } from "./command-palette";
import { isActive, NAV_COLLECT, NAV_MAIN, NAV_UTILITY } from "./nav-config";
import { Mark } from "./wordmark";

/**
 * Below 768px the sidebar folds into a top bar (mark, page name, search) and a bottom bar of the
 * four everyday destinations plus "More". Both are glass bars in Liquid Glass.
 */
export function MobileNav({ signOut }: { signOut?: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [more, setMore] = useState(false);
  const current = [...NAV_MAIN, ...NAV_COLLECT, ...NAV_UTILITY].find((n) => isActive(pathname, n.href));
  const moreActive = [...NAV_COLLECT, ...NAV_UTILITY].some((n) => isActive(pathname, n.href));

  return (
    <>
      <header className="glass-bar sticky top-0 z-40 flex h-13 items-center gap-3 border-b bg-surface px-4 md:hidden">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-[0.9375rem] font-semibold">
          <Mark />
          TechOpps
          {current && current.href !== "/" && (
            <span className="truncate font-normal text-muted-foreground">
              <span aria-hidden className="pr-2 text-faint">/</span>
              {current.label}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={openPalette}
          aria-label="Search"
          className="-mr-2 grid size-11 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <Search className="size-5" aria-hidden />
        </button>
      </header>

      <nav
        aria-label="Main"
        className="glass-bar fixed inset-x-0 bottom-0 z-40 border-t bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid h-16 grid-cols-5">
          {NAV_MAIN.map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-1 text-xs transition-colors",
                    active ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-surface-3 glass:bg-surface/80")}>
                    <n.icon className="size-5" aria-hidden />
                  </span>
                  {n.short ?? n.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMore(true)}
              aria-haspopup="dialog"
              aria-expanded={more}
              className={cn(
                "relative flex h-full w-full flex-col items-center justify-center gap-1 text-xs",
                moreActive ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <span className={cn("grid h-7 w-12 place-items-center rounded-full", moreActive && "bg-surface-3 glass:bg-surface/80")}>
                <Ellipsis className="size-5" aria-hidden />
              </span>
              More
              <UnreadBadge className="absolute top-1.5 right-[calc(50%-1.5rem)] h-4 min-w-4 px-1 text-[0.6875rem]" />
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title="More" side="bottom">
        <ul className="grid gap-0.5">
          {[...NAV_COLLECT, ...NAV_UTILITY].map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setMore(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-12 items-center gap-3 rounded-md px-3 text-[0.9375rem]",
                    active ? "bg-surface-3 font-medium" : "hover:bg-surface-2",
                  )}
                >
                  <n.icon className="size-5 text-muted-foreground" aria-hidden />
                  <span className="flex-1">{n.label}</span>
                  {n.href === "/notifications" && <UnreadBadge />}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="my-3 h-px bg-rule" />
        <AppearanceList />
        {signOut && (
          <>
            <div className="my-3 h-px bg-rule" />
            {signOut}
          </>
        )}
      </Sheet>
    </>
  );
}
