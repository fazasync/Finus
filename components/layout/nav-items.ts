import { DashboardIcon, ReportsIcon, SettingsIcon, TransactionsIcon } from "@/components/ui/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof DashboardIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/app/transactions", label: "Transaksi", icon: TransactionsIcon },
  { href: "/app/reports", label: "Laporan", icon: ReportsIcon },
  { href: "/app/settings", label: "Pengaturan", icon: SettingsIcon },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}
