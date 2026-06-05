import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PricingCards } from "@/components/PricingCards";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span>🌌</span> FareWELL
        </div>
        <div className="flex gap-3">
          <Link href="/auth">
            <Button variant="secondary">Sign in</Button>
          </Link>
          <Link href="/auth?mode=register">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <section className="flex-1 mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
          Stellar-native digital legacy
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Leave messages your loved ones can trust — anchored on Stellar
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          Encrypt farewell letters client-side, anchor SHA-256 hashes on Stellar
          testnet, and deliver them when verifiers confirm inactivity — every
          step cryptographically auditable.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/auth?mode=register">
            <Button className="px-8 py-3 text-base">Create your legacy</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="secondary" className="px-8 py-3 text-base">
              View pricing
            </Button>
          </Link>
          <Link href="/portal">
            <Button variant="secondary" className="px-8 py-3 text-base">
              Family verification portal
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="text-center text-2xl font-bold mb-8">Annual plans</h2>
        <PricingCards />
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 md:grid-cols-3">
        <Card>
          <div className="mb-3 text-2xl">🔐</div>
          <h3 className="font-semibold">Client-side encryption</h3>
          <p className="mt-2 text-sm text-muted">
            AES-256-GCM with a passphrase only you know. Private keys never
            leave your wallet.
          </p>
        </Card>
        <Card>
          <div className="mb-3 text-2xl">⛓️</div>
          <h3 className="font-semibold">Stellar anchoring</h3>
          <p className="mt-2 text-sm text-muted">
            Content hashes recorded on testnet via MEMO_HASH transactions —
            tamper-evident proof on-chain.
          </p>
        </Card>
        <Card>
          <div className="mb-3 text-2xl">🗳️</div>
          <h3 className="font-semibold">Verifier consensus</h3>
          <p className="mt-2 text-sm text-muted">
            Trusted contacts vote on inactivity. Delivery unlocks when consensus
            is reached.
          </p>
        </Card>
      </section>
    </div>
  );
}
