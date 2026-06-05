import { TextareaHTMLAttributes } from "react";

export function Textarea({
  label,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm text-muted">{label}</span>}
      <textarea
        className={`w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-h-[120px] ${className}`}
        {...props}
      />
    </label>
  );
}
