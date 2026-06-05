"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Card } from "@/components/ui/Card";
import { Timeline } from "@/components/Timeline";
import { api, TimelineEvent } from "@/lib/api";

export default function TimelinePage() {
  return (
    <RequireAuth>
      <TimelineContent />
    </RequireAuth>
  );
}

function TimelineContent() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    api.timeline().then((r) => setEvents(r.timeline));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit timeline</h1>
        <p className="text-muted mt-1">
          Every message, anchor, vote, ping, and delivery — linked to Stellar
          transactions where applicable.
        </p>
      </div>
      <Card>
        <Timeline events={events} />
      </Card>
    </div>
  );
}
