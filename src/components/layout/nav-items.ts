import { GraduationCap, type LucideIcon, Trophy, Users } from "lucide-react";

export type NavItem = {
  href: "/courses" | "/community" | "/leaderboard";
  label: string;
  icon: LucideIcon;
};

/** The three main areas of LEARNIVERSE, in the order they appear in the rail and bottom tabs. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/courses", label: "Học tập", icon: GraduationCap },
  { href: "/community", label: "Mạng xã hội", icon: Users },
  { href: "/leaderboard", label: "Bảng xếp hạng", icon: Trophy },
];

/** The nav item that owns a pathname: the area itself or any page nested under it. */
export function activeNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
