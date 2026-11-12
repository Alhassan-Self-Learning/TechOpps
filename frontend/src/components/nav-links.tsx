"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { UnreadBadge } from "@/components/notifications/unread-badge";
import { isActive, NAV_COLLECT, NAV_MAIN, NAV_UTILITY, type NavItem } from "@/components/shell/nav-config";
import { cn } from "@/lib/utils";

function NavRow({ item, pathname }: { item: NavItem; pathname: string | null }) {
  const active = pathname !== null && isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-[var(--dur-1)]",
          active
            ? "bg-surface-3 font-medium text-foreground glass:bg-surface"
            : "text-muted-foreground hover:bg-surface-2 hover:text-foreground glass:hover:bg-surface/50",
        )}
      >
        <Icon className={cn("size-4 shrink-0", active ? "text-foreground" : "text-faint group-hover:text-foreground")} aria-hidden />
        <span className="flex-1 truncate">{item.label}</span>
        {item.href === "/notifications" && <UnreadBadge />}
      </Link>
    </li>
  );
}

function Group({ label, items, pathname }: { label?: string; items: NavItem[]; pathname: string | null }) {
  return (
    <div>
      {label && <p className="px-2.5 pt-5 pb-1.5 text-xs text-faint">{label}</p>}
      <ul className="grid gap-0.5">
        {items.map((item) => (
          <NavRow key={item.href} item={item} pathname={pathname} />
        ))}
      </ul>
    </div>
  );
}

function SidebarNavList({ pathname }: { pathname: string | null }) {
  return (
    <>
      <Group items={NAV_MAIN} pathname={pathname} />
      <Group label="Collection" items={NAV_COLLECT} pathname={pathname} />
    </>
  );
}

function UtilityNavList({ pathname }: { pathname: string | null }) {
  return <Group items={NAV_UTILITY} pathname={pathname} />;
}

/** Highlights the current page. Rendered inside <Suspense> because it reads the URL. */
export function NavLinks() {
  return <SidebarNavList pathname={usePathname()} />;
}

/** Same links without highlighting, used while the URL is not yet known. */
export function NavLinksFallback() {
  return <SidebarNavList pathname={null} />;
}

export function UtilityLinks() {
  return <UtilityNavList pathname={usePathname()} />;
}

export function UtilityLinksFallback() {
  return <UtilityNavList pathname={null} />;
}
