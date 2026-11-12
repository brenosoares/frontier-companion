"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface NavLinkProps {
  href: string;
  /** Exact match only (needed for home, whose path prefixes every other route). */
  exact?: boolean;
  onNavigate?: () => void;
  children: ReactNode;
}

export function NavLink({ href, exact = false, onNavigate, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      {...(onNavigate && { onClick: onNavigate })}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        isActive
          ? "bg-surface-hover text-link"
          : "text-muted hover:bg-surface-hover hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
