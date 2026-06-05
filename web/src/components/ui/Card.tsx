import { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface/80 backdrop-blur p-6 ${className}`}
    >
      {children}
    </div>
  );
}
