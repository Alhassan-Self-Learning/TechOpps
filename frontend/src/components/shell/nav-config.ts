import {
  Bell,
  Bookmark,
  ClipboardCheck,
  Compass,
  KanbanSquare,
  LayoutDashboard,
  Radio,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; short?: string };

/** Your work with opportunities. */
export const NAV_MAIN: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, short: "Home" },
  { href: "/opportunities", label: "Discover", icon: Compass },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/tracking", label: "Tracking", icon: KanbanSquare },
];

/** How opportunities get in: sources and the AI review queue. */
export const NAV_COLLECT: NavItem[] = [
  { href: "/sources", label: "Sources", icon: Radio },
  { href: "/review", label: "Review", icon: ClipboardCheck },
];

export const NAV_UTILITY: NavItem[] = [
  { href: "/notifications", label: "Reminders", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const NAV_ALL = [...NAV_MAIN, ...NAV_COLLECT, ...NAV_UTILITY];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
