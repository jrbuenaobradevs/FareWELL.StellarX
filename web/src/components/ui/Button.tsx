"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent hover:bg-accent-dim text-white shadow-lg shadow-accent/20",
  secondary:
    "bg-surface-elevated hover:bg-border border border-border text-foreground",
  ghost: "hover:bg-surface-elevated text-muted hover:text-foreground",
  danger: "bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
