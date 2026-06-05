"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PLAN_COPY } from "@/lib/plans";

export function PricingCards({ showCta = true }: { showCta?: boolean }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
      <Card className="relative">
        <h3 className="text-xl font-bold">{PLAN_COPY.free.name}</h3>
        <p className="text-sm text-muted mt-1">{PLAN_COPY.free.tagline}</p>
        <p className="mt-4">
          <span className="text-4xl font-bold">{PLAN_COPY.free.price}</span>
          <span className="text-muted ml-2">{PLAN_COPY.free.period}</span>
        </p>
        <ul className="mt-6 space-y-2 text-sm text-muted">
          {PLAN_COPY.free.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-success">✓</span> {f}
            </li>
          ))}
        </ul>
        {showCta && (
          <Link href="/auth?mode=register" className="mt-8 block">
            <Button variant="secondary" className="w-full">
              Start free
            </Button>
          </Link>
        )}
      </Card>

      <Card className="relative border-accent/40 ring-1 ring-accent/20">
        <span className="absolute -top-3 right-4 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-white">
          Best value
        </span>
        <h3 className="text-xl font-bold">{PLAN_COPY.premium.name}</h3>
        <p className="text-sm text-muted mt-1">{PLAN_COPY.premium.tagline}</p>
        <p className="mt-4">
          <span className="text-4xl font-bold">{PLAN_COPY.premium.price}</span>
          <span className="text-muted ml-2">{PLAN_COPY.premium.period}</span>
        </p>
        <ul className="mt-6 space-y-2 text-sm">
          {PLAN_COPY.premium.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-accent">✓</span> {f}
            </li>
          ))}
        </ul>
        {showCta && (
          <Link href="/subscription" className="mt-8 block">
            <Button className="w-full">Upgrade to Premium</Button>
          </Link>
        )}
      </Card>
    </div>
  );
}
