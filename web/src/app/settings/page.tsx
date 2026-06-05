"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { PlanBadge } from "@/components/PlanBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useWallet } from "@/hooks/useWallet";
import { api } from "@/lib/api";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}

function SettingsContent() {
  const { user, refreshUser } = useAuth();
  const { subscription, isPremium } = useSubscription();
  const wallet = useWallet();
  const [name, setName] = useState(user?.name ?? "");
  const [inactivityDays, setInactivityDays] = useState(
    String(user?.inactivityDays ?? 30),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.inactivityDays) setInactivityDays(String(user.inactivityDays));
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      let stellarPublicKey = user?.stellarPublicKey;
      if (wallet.publicKey) stellarPublicKey = wallet.publicKey;

      await api.updateMe({
        name,
        inactivityDays: Number(inactivityDays),
        stellarPublicKey,
      });
      await refreshUser();
      setStatus("Settings saved.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const connectWallet = async () => {
    try {
      const pk = await wallet.connect();
      await api.updateMe({ stellarPublicKey: pk });
      await refreshUser();
      setStatus(`Wallet linked: ${pk.slice(0, 8)}…`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Wallet connect failed");
    }
  };

  const fixedInterval = subscription?.limits.fixedActivityIntervalDays;

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted mt-1">Profile and inactivity preferences.</p>
        </div>
        <PlanBadge subscription={subscription} />
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-medium">
            {isPremium ? "Premium annual plan" : "Free plan"}
          </p>
          <p className="text-sm text-muted">
            {isPremium && user?.subscriptionExpiresAt
              ? `Active until ${new Date(user.subscriptionExpiresAt).toLocaleDateString()}`
              : "Upgrade for unlimited recipients, video, and attachments"}
          </p>
        </div>
        <Link href="/subscription">
          <Button variant={isPremium ? "secondary" : "primary"}>
            {isPremium ? "Manage" : "Upgrade — $19.99/yr"}
          </Button>
        </Link>
      </Card>

      <Card>
        <form onSubmit={save} className="space-y-4">
          <Input
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <Input
              label="Inactivity threshold (days)"
              type="number"
              min={7}
              value={inactivityDays}
              onChange={(e) => setInactivityDays(e.target.value)}
              disabled={!isPremium}
            />
            {!isPremium && fixedInterval != null && (
              <p className="text-xs text-muted mt-1">
                Free plan uses a fixed {fixedInterval}-day activity check interval.
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted mb-2">Stellar wallet (Freighter)</p>
            <p className="font-mono text-xs mb-3 break-all">
              {user?.stellarPublicKey ?? "Not linked"}
            </p>
            <Button type="button" variant="secondary" onClick={connectWallet}>
              {wallet.connecting ? "Connecting…" : "Connect Freighter"}
            </Button>
          </div>
          {status && <p className="text-sm text-muted">{status}</p>}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold mb-2">Security model</h2>
        <ul className="text-sm text-muted space-y-2 list-disc pl-5">
          <li>Messages encrypted client-side with AES-256-GCM</li>
          <li>SHA-256 content hashes anchored on Stellar testnet</li>
          <li>Encryption passphrases never sent to the server</li>
          <li>Freighter signs all on-chain events</li>
        </ul>
      </Card>
    </div>
  );
}
