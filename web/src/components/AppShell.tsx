"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/Button";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/messages", label: "Messages" },
  { href: "/verifiers", label: "Verifiers" },
  { href: "/timeline", label: "Timeline" },
  { href: "/subscription", label: "Plan" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="text-xl">🌌</span>
            <span>FareWELL</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  pathname.startsWith(item.href)
                    ? "bg-accent/20 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-muted">{user?.name}</span>
            <Button
              variant="ghost"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
