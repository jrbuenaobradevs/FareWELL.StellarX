const styles: Record<string, string> = {
  draft: "bg-muted/20 text-muted border-muted/30",
  active: "bg-accent/20 text-accent border-accent/30",
  scheduled: "bg-warning/20 text-warning border-warning/30",
  delivered: "bg-success/20 text-success border-success/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] ?? styles.draft}`}
    >
      {status}
    </span>
  );
}
