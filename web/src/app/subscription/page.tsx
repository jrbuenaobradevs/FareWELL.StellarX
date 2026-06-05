"use client";

import Link from "next/link";
import { useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { PricingCards } from "@/components/PricingCards";
import { PlanBadge } from "@/components/PlanBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TxHashBadge } from "@/components/TxHashBadge";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useWallet } from "@/hooks/useWallet";
import { api } from "@/lib/api";
import {
  buildSubscriptionPaymentTx,
  ensureUsdcTrustline,
  fetchPaymentConfig,
} from "@/lib/subscription";
import { fundTestnetAccount, signAndSubmit } from "@/lib/stellar";

export default function SubscriptionPage() {
  return (
    <RequireAuth>
      <SubscriptionContent />
    </RequireAuth>
  );
}

function SubscriptionContent() {
  const { user, refreshUser } = useAuth();
  const { subscription, refresh, isPremium } = useSubscription();
  const wallet = useWallet();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const payWithUsdc = async () => {
    if (!user) return;
    setLoading(true);
    setStatus(null);
    try {
      setStatus("Loading payment config…");
      const config = await fetchPaymentConfig();
      if (!config.recipient) {
        throw new Error(
          "Server subscription wallet not set. Add SUBSCRIPTION_WALLET_G to the API.",
        );
      }

      let pk = wallet.publicKey ?? user.stellarPublicKey;
      if (!pk) pk = await wallet.connect();
      await fundTestnetAccount(pk);

      setStatus("Checking USDC trustline…");
      const trustXdr = await ensureUsdcTrustline(pk, config.usdcIssuer);
      if (trustXdr) {
        setStatus("Add USDC trustline in Freighter…");
        await signAndSubmit(trustXdr);
      }

      setStatus("Sign $19.99 USDC payment in Freighter…");
      const xdr = await buildSubscriptionPaymentTx(pk, config, user.id);
      const hash = await signAndSubmit(xdr);

      setStatus("Activating Premium…");
      await api.activateSubscription(hash);
      await refreshUser();
      await refresh();
      setStatus(`Premium active until next year. Payment: ${hash.slice(0, 12)}…`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const demoActivate = async () => {
    setLoading(true);
    try {
      await api.demoActivateSubscription();
      await refreshUser();
      await refresh();
      setStatus("Premium activated (demo mode for local dev)");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Demo activation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Subscription</h1>
        <PlanBadge subscription={subscription} />
      </div>

      {isPremium && subscription?.subscriptionExpiresAt && (
        <Card className="border-warning/30 bg-warning/5">
          <p className="font-medium text-warning">Premium active</p>
          <p className="text-sm text-muted mt-1">
            Renews / expires{" "}
            {new Date(subscription.subscriptionExpiresAt).toLocaleDateString()}
          </p>
          {user?.subscriptionTxHash && !user.subscriptionTxHash.startsWith("demo") && (
            <div className="mt-2">
              <TxHashBadge hash={user.subscriptionTxHash} />
            </div>
          )}
        </Card>
      )}

      {subscription && (
        <Card>
          <h2 className="font-semibold mb-3">Your usage</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted">Recipients</p>
              <p className="text-lg font-medium">
                {subscription.usage.recipients}
                {subscription.limits.maxRecipients != null &&
                  ` / ${subscription.limits.maxRecipients}`}
              </p>
            </div>
            <div>
              <p className="text-muted">Verifiers</p>
              <p className="text-lg font-medium">
                {subscription.usage.verifiers}
                {subscription.limits.maxVerifiers != null &&
                  ` / ${subscription.limits.maxVerifiers}`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {!isPremium && (
        <>
          <PricingCards showCta={false} />
          <Card>
            <h2 className="font-semibold">Pay with USDC on Stellar testnet</h2>
            <p className="text-sm text-muted mt-2">
              $19.99/year — one USDC payment anchors your annual Premium
              subscription. Link Freighter, fund testnet USDC, then pay.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={payWithUsdc} disabled={loading}>
                {loading ? "Processing…" : "Pay $19.99 USDC / year"}
              </Button>
              <Button variant="secondary" onClick={demoActivate} disabled={loading}>
                Demo activate (local dev)
              </Button>
            </div>
            {status && <p className="mt-4 text-sm text-muted">{status}</p>}
          </Card>
        </>
      )}

      <Link href="/settings">
        <Button variant="ghost">← Back to settings</Button>
      </Link>
    </div>
  );
}
