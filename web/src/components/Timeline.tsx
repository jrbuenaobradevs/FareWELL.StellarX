import { TimelineEvent } from "@/lib/api";
import { TxHashBadge } from "./TxHashBadge";

const icons: Record<string, string> = {
  message_created: "✉️",
  message_anchored: "⛓️",
  activity_ping: "💓",
  verifier_vote: "🗳️",
  delivery_triggered: "🚀",
  message_delivered: "🕊️",
  subscription_activated: "⭐",
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted py-8 text-center">
        No events yet. Create a message or log activity to see your audit trail.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0 border-l border-border ml-3">
      {events.map((event) => (
        <li key={event.id} className="mb-6 ml-6">
          <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-surface-elevated border border-border text-xs">
            {icons[event.type] ?? "•"}
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{event.label}</p>
            <time className="text-xs text-muted">
              {new Date(event.createdAt).toLocaleString()}
            </time>
            {event.stellarTxHash && (
              <TxHashBadge hash={event.stellarTxHash} />
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
