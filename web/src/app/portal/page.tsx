"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/StatusBadge";
import { TxHashBadge } from "@/components/TxHashBadge";
import { useWallet } from "@/hooks/useWallet";
import { api } from "@/lib/api";
import {
  buildVerifierVoteTx,
  fundTestnetAccount,
  signAndSubmit,
} from "@/lib/stellar";

function PortalForm() {
  const params = useSearchParams();
  const wallet = useWallet();

  const [messageId, setMessageId] = useState(params.get("messageId") ?? "");
  const [email, setEmail] = useState("");
  const [portal, setPortal] = useState<Awaited<ReturnType<typeof api.portal>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const data = await api.portal(messageId, email);
      setPortal(data);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Lookup failed");
      setPortal(null);
    } finally {
      setLoading(false);
    }
  };

  const vote = async (confirmed: boolean) => {
    if (!portal) return;
    setLoading(true);
    setStatus("Signing vote on Stellar…");
    try {
      let pk = wallet.publicKey;
      if (!pk) pk = await wallet.connect();
      await fundTestnetAccount(pk);
      const xdr = await buildVerifierVoteTx(pk, messageId, confirmed ? "confirm" : "reject");
      const hash = await signAndSubmit(xdr);
      await api.submitVote(messageId, {
        verifierEmail: email,
        confirmed,
        stellarTxHash: hash,
      });
      const refreshed = await api.portal(messageId, email);
      setPortal(refreshed);
      setStatus(`Vote recorded on Stellar: ${hash.slice(0, 12)}…`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Vote failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-lg space-y-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span>🌌</span> FareWELL
        </Link>

        <div>
          <h1 className="text-3xl font-bold">Family verification portal</h1>
          <p className="text-muted mt-2 text-sm">
            Verifiers use this portal to review legacy messages and cast
            Stellar-anchored votes on inactivity.
          </p>
        </div>

        <Card>
          <form onSubmit={lookup} className="space-y-4">
            <Input
              label="Message ID"
              value={messageId}
              onChange={(e) => setMessageId(e.target.value)}
              required
            />
            <Input
              label="Your verifier email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading…" : "Look up message"}
            </Button>
          </form>
        </Card>

        {status && <p className="text-sm text-muted">{status}</p>}

        {portal && (
          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{portal.message.title}</h2>
              <StatusBadge status={portal.message.status} />
            </div>
            <p className="text-sm text-muted">
              Owner: {portal.owner?.name ?? "—"} · Recipient:{" "}
              {portal.message.recipient}
            </p>
            <p className="text-sm text-muted">
              Last owner activity:{" "}
              {portal.owner?.lastActivityAt
                ? new Date(portal.owner.lastActivityAt).toLocaleString()
                : "Unknown"}
            </p>
            <TxHashBadge hash={portal.message.stellarTxHash} />
            <p className="font-mono text-xs text-muted break-all">
              Content hash: {portal.message.contentHash}
            </p>

            {portal.message.status !== "delivered" && (
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  disabled={loading}
                  onClick={() => vote(true)}
                >
                  Confirm inactivity
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  disabled={loading}
                  onClick={() => vote(false)}
                >
                  Reject
                </Button>
              </div>
            )}

            {portal.bodyEncrypted && (
              <div className="rounded-lg border border-success/30 bg-success/10 p-4">
                <p className="text-sm font-medium text-success mb-2">
                  Message delivered — encrypted payload
                </p>
                <p className="font-mono text-xs break-all text-muted">
                  {portal.bodyEncrypted.slice(0, 200)}…
                </p>
                <p className="text-xs text-muted mt-2">
                  Decrypt with the passphrase shared by the owner.
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense>
      <PortalForm />
    </Suspense>
  );
}
