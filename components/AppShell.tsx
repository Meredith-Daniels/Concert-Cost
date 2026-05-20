"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  ListMusic,
  MapPin,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { ThemeSelector } from "@/components/ThemeSelector";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/nearby", label: "Nearby", icon: MapPin },
  { href: "/recommended", label: "For You", icon: Sparkles },
  { href: "/liked", label: "Liked", icon: Heart },
  { href: "/add", label: "Add Concert", icon: PlusCircle },
  { href: "/concerts", label: "My Concerts", icon: ListMusic },
];

type AppShellProps = {
  userEmail: string;
  children: React.ReactNode;
};

export function AppShell({ userEmail, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <section className="flex min-h-screen flex-col bg-base-200">
      <header className="navbar sticky top-0 z-40 border-b border-base-300 bg-base-100/90 px-4 shadow-sm backdrop-blur-md">
        <section className="flex-1 flex-col items-start gap-0 sm:flex-row sm:items-center">
          <h1 className="text-lg font-bold sm:text-xl">Concert Cost Tracker</h1>
          <p className="hidden text-xs text-base-content/70 sm:block sm:pl-3 sm:text-sm">
            Track what you spend and how much fun you had
          </p>
        </section>
        <section className="flex-none items-center gap-2">
          <ThemeSelector compact className="hidden max-w-[8rem] sm:block" />
          <LogoutButton />
        </section>
      </header>

      <section className="border-b border-base-300 bg-base-100 px-4 py-2 sm:hidden">
        <ThemeSelector compact />
        <p className="mt-2 text-xs text-base-content/70">
          Signed in as <span className="font-medium">{userEmail}</span>
        </p>
      </section>

      {/* Desktop pill nav */}
      <nav
        aria-label="Main navigation"
        className="page-container hidden gap-2 pb-0 pt-4 sm:flex"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`btn btn-sm btn-interactive gap-2 motion-safe-transition ${
                active ? "btn-primary" : "btn-ghost"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <main className="page-container section-gap flex-1 pb-24 sm:pb-6">
        <p className="hidden text-sm text-base-content/70 sm:block">
          Signed in as <span className="font-medium">{userEmail}</span>
        </p>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Main navigation"
        className="btm-nav btm-nav-md fixed bottom-0 left-0 right-0 z-40 border-t border-base-300 bg-base-100/95 backdrop-blur-md sm:hidden"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={active ? "active text-primary" : ""}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="btm-nav-label text-xs">{label}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
