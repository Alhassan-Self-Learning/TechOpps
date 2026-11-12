import { Suspense } from "react";

import { AppearanceMenu } from "@/components/appearance/appearance-menu";
import { AppearanceSync } from "@/components/appearance/appearance-picker";
import { CommandPalette } from "@/components/shell/command-palette";
import { MobileNav } from "@/components/shell/mobile-nav";
import { SearchButton } from "@/components/shell/search-button";
import { Wordmark } from "@/components/shell/wordmark";

import { NavLinks, NavLinksFallback, UtilityLinks, UtilityLinksFallback } from "./nav-links";
import { SignOut } from "./sign-out";

/**
 * Desktop: a labelled sidebar on the page ground, separated by one hairline. In Liquid Glass the
 * sidebar becomes a floating pane inset from the window edge. Phone: top bar + bottom bar.
 *
 * Canvas arithmetic at 1440: 1440 - 240 sidebar = 1200; minus 2 x 40 gutters = 1120 content,
 * which pages cap at 72rem (1152) so wide screens keep one measure.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-float"
      >
        Skip to content
      </a>
      <AppearanceSync />

      <aside
        aria-label="Sidebar"
        className="hidden md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:border-r md:bg-background md:px-3 md:py-4 glass:md:m-2 glass:md:h-[calc(100dvh-1rem)] glass:md:rounded-xl glass:md:border glass-pane"
      >
        <div className="px-2.5 pb-4">
          <Wordmark />
        </div>
        <SearchButton />
        <nav aria-label="Main" className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <Suspense fallback={<NavLinksFallback />}>
            <NavLinks />
          </Suspense>
        </nav>
        <div className="grid gap-0.5 border-t border-rule pt-2 glass:border-glass-line">
          <Suspense fallback={<UtilityLinksFallback />}>
            <UtilityLinks />
          </Suspense>
          <AppearanceMenu />
          <Suspense>
            <SignOut />
          </Suspense>
        </div>
      </aside>

      <Suspense>
        <MobileNav
          signOut={
            <Suspense>
              <SignOut />
            </Suspense>
          }
        />
      </Suspense>

      <main id="main" tabIndex={-1} className="min-w-0 px-4 pt-5 pb-28 outline-none sm:px-6 md:px-8 md:pt-8 md:pb-16 lg:px-10">
        {children}
      </main>

      <CommandPalette />
    </div>
  );
}
