import Link from "next/link";
import { PricingCards } from "@/components/PricingCards";
import { Button } from "@/components/ui/Button";

export default function PricingPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-4xl text-center mb-12">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold mb-8">
          <span>🌌</span> FareWELL
        </Link>
        <h1 className="text-4xl font-bold">Simple annual pricing</h1>
        <p className="text-muted mt-4 max-w-2xl mx-auto">
          Start free to explore digital legacy basics. Upgrade to Premium for
          unlimited recipients, video messages, attachments, and multiple
          verification contacts — billed once per year via USDC on Stellar
          testnet.
        </p>
      </div>
      <PricingCards />
      <p className="text-center text-xs text-muted mt-8 max-w-lg mx-auto">
        Premium renews annually at $19.99. Payments are verified on-chain via
        Horizon. Testnet USDC from the{" "}
        <a
          href="https://faucet.circle.com/"
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Circle faucet
        </a>
        .
      </p>
      <div className="text-center mt-8">
        <Link href="/">
          <Button variant="ghost">← Back home</Button>
        </Link>
      </div>
    </div>
  );
}
