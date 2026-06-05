import { InputHTMLAttributes } from "react";

export function Input({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm text-muted">{label}</span>}
      <input
        className={`w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${className}`}
        {...props}
      />
    </label>
  );
}
