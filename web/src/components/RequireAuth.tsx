"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "./AppShell";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
