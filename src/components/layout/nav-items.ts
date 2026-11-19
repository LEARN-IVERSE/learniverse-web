import { GraduationCap, type LucideIcon, Trophy, Users } from "lucide-react";

export type NavItem = {
  href: "/hoc-tap" | "/mang-xa-hoi" | "/bang-xep-hang";
  label: string;
  icon: LucideIcon;
};

/** The three main areas of LEARNIVERSE, in the order they appear in the rail and bottom tabs. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/hoc-tap", label: "Học tập", icon: GraduationCap },
  { href: "/mang-xa-hoi", label: "Mạng xã hội", icon: Users },
  { href: "/bang-xep-hang", label: "Bảng xếp hạng", icon: Trophy },
];

/** The nav item that owns a pathname: the area itself or any page nested under it. */
export function activeNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
