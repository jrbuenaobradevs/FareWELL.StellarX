"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { TxHashBadge } from "@/components/TxHashBadge";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { api, LegacyMessage } from "@/lib/api";
import {
  buildActivityPingTx,
  fundTestnetAccount,
  signAndSubmit,
} from "@/lib/stellar";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const { user, refreshUser } = useAuth();
  const wallet = useWallet();
  const [messages, setMessages] = useState<LegacyMessage[]>([]);
  const [pinging, setPinging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    api.messages().then((r) => setMessages(r.messages));
  }, []);

  const handlePing = async () => {
    setPinging(true);
    setStatus(null);
    try {
      let pk = wallet.publicKey;
      if (!pk) pk = await wallet.connect();
      await fundTestnetAccount(pk);
      const xdr = await buildActivityPingTx(pk);
      const hash = await signAndSubmit(xdr);
      await api.activityPing(hash);
      await refreshUser();
      setStatus(`Activity logged on Stellar: ${hash.slice(0, 12)}…`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Ping failed");
    } finally {
      setPinging(false);
    }
  };

  const active = messages.filter((m) => m.status === "active").length;
  const delivered = messages.filter((m) => m.status === "delivered").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted">
          Welcome back, {user?.name}. Your legacy is secured on Stellar testnet.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-muted">Messages</p>
          <p className="text-3xl font-bold">{messages.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Active</p>
          <p className="text-3xl font-bold text-accent">{active}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Delivered</p>
          <p className="text-3xl font-bold text-success">{delivered}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Last activity</p>
          <p className="text-sm font-medium mt-2">
            {user?.lastActivityAt
              ? new Date(user.lastActivityAt).toLocaleDateString()
              : "—"}
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Activity check-in</h2>
            <p className="text-sm text-muted mt-1">
              Log a Stellar testnet ping to prove you&apos;re still active.
              Inactivity threshold: {user?.inactivityDays ?? 30} days.
            </p>
          </div>
          <Button onClick={handlePing} disabled={pinging}>
            {pinging ? "Signing…" : "Log activity on Stellar"}
          </Button>
        </div>
        {status && <p className="mt-3 text-sm text-muted">{status}</p>}
      </Card>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent messages</h2>
          <Link href="/messages">
            <Button variant="secondary">View all</Button>
          </Link>
        </div>
        {messages.length === 0 ? (
          <Card>
            <p className="text-muted text-sm">No messages yet.</p>
            <Link href="/messages" className="mt-4 inline-block">
              <Button>Create your first message</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {messages.slice(0, 5).map((m) => (
              <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-sm text-muted">To: {m.recipient}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={m.status} />
                  <TxHashBadge hash={m.stellarTxHash} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
