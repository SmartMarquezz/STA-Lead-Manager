"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StaLogo } from "@/components/StaLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSync } from "@/components/SyncProvider";
import { useAuth } from "@/components/AuthProvider";
import { signOut, User } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/import", label: "Import" },
  { href: "/settings", label: "Settings" },
];

interface NavBarProps {
  user: User | null;
}

export function NavBar({ user }: NavBarProps) {
  const pathname = usePathname();
  const { syncing, dataSource } = useSync();
  const { isDemo } = useAuth();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      {syncing && (
        <div className="bg-sta-cyan px-4 py-1.5 text-center text-xs font-medium text-white">
          <RefreshCw className="mr-1 inline h-3 w-3 animate-spin" />
          Syncing spreadsheet...
        </div>
      )}
      {!isDemo && !dataSource?.hasSource && !syncing && (
        <div className="bg-gold/90 px-4 py-1.5 text-center text-xs font-medium text-white">
          Spreadsheet not connected —{" "}
          <Link href="/settings" className="font-bold underline">
            set up sync in Settings
          </Link>
        </div>
      )}
    <header className="sticky top-0 z-40 border-b border-[#E2EDF5] bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <StaLogo size="sm" />

        <nav className="hidden items-center gap-6 md:flex lg:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "sta-nav-link",
                isActive(link.href) && "sta-nav-link-active"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden text-right lg:block">
              <p className="text-sm font-semibold text-sta-navy">{user.displayName}</p>
              <p className="text-xs text-sta-teal">{user.email}</p>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
              <AvatarFallback className="bg-[#E8F4FA] font-serif text-sm font-bold text-sta-logo">
                {user.displayName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => signOut()}
              className="text-xs font-semibold uppercase tracking-wider text-sta-navy transition-colors hover:text-sta-cyan"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Mobile nav */}
      <nav className="flex gap-1 overflow-x-auto border-t border-[#E2EDF5] px-4 py-2 md:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 text-xs uppercase tracking-wide",
              isActive(link.href)
                ? "bg-sta-navy font-bold text-white"
                : "text-sta-navy hover:bg-[#E8F4FA]"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
    </>
  );
}
