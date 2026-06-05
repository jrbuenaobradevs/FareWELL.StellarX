"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useSubscription } from "@/hooks/useSubscription";
import { api, Verifier } from "@/lib/api";

export default function VerifiersPage() {
  return (
    <RequireAuth>
      <VerifiersContent />
    </RequireAuth>
  );
}

function VerifiersContent() {
  const { subscription, isPremium } = useSubscription();
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    relationship: "",
    stellarAddress: "",
    priority: 1,
  });

  const load = () => api.verifiers().then((r) => setVerifiers(r.verifiers));

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createVerifier({
        name: form.name,
        email: form.email,
        relationship: form.relationship,
        stellarAddress: form.stellarAddress || undefined,
        priority: form.priority,
      });
      setOpen(false);
      setForm({ name: "", email: "", relationship: "", stellarAddress: "", priority: 1 });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add verifier");
    }
  };

  const atVerifierLimit =
    subscription?.limits.maxVerifiers != null &&
    verifiers.length >= subscription.limits.maxVerifiers;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Verifiers</h1>
          <p className="text-muted mt-1">
            Trusted contacts who confirm inactivity and vote on delivery.
            {!isPremium && subscription && (
              <span className="block text-xs mt-1">
                Free plan: {subscription.usage.verifiers}/
                {subscription.limits.maxVerifiers} verification contact
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={atVerifierLimit}>
          Add verifier
        </Button>
      </div>

      {atVerifierLimit && (
        <Card className="py-3 border-accent/30 bg-accent/5 text-sm">
          Free plan allows one verifier.{" "}
          <Link href="/subscription" className="text-accent hover:underline">
            Upgrade to Premium
          </Link>{" "}
          for multiple verification contacts.
        </Card>
      )}

      {verifiers.length === 0 ? (
        <Card className="text-center py-12 text-muted text-sm">
          Add at least one verifier for consensus-based delivery.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {verifiers.map((v) => (
            <Card key={v.id}>
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{v.name}</h3>
                  <p className="text-sm text-muted">{v.email}</p>
                  <p className="text-sm mt-1">{v.relationship}</p>
                  {v.stellarAddress && (
                    <p className="font-mono text-xs text-muted mt-2 truncate">
                      {v.stellarAddress}
                    </p>
                  )}
                </div>
                <Button
                  variant="danger"
                  onClick={async () => {
                    if (!confirm("Remove this verifier?")) return;
                    await api.deleteVerifier(v.id);
                    await load();
                  }}
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add verifier">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Relationship"
            placeholder="e.g. Spouse, Sibling, Attorney"
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            required
          />
          <Input
            label="Stellar address (optional)"
            value={form.stellarAddress}
            onChange={(e) => setForm({ ...form, stellarAddress: e.target.value })}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full">
            Save verifier
          </Button>
        </form>
      </Modal>
    </div>
  );
}
