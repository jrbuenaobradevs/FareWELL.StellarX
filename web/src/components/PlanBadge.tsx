import { SubscriptionInfo } from "@/lib/plans";

export function PlanBadge({ subscription }: { subscription: SubscriptionInfo | null }) {
  const premium = subscription?.plan === "premium";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        premium
          ? "border-warning/40 bg-warning/15 text-warning"
          : "border-border bg-surface-elevated text-muted"
      }`}
    >
      {premium ? "Premium" : "Free"}
    </span>
  );
}
