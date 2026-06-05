import { explorerTxUrl } from "@/lib/stellar";

export function TxHashBadge({ hash }: { hash?: string }) {
  if (!hash) {
    return (
      <span className="text-xs text-muted italic">Not anchored yet</span>
    );
  }

  const short = `${hash.slice(0, 8)}…${hash.slice(-6)}`;

  return (
    <a
      href={explorerTxUrl(hash)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2 py-1 font-mono text-xs text-accent hover:bg-accent/20"
      title={hash}
    >
      <span className="text-success">⛓</span>
      {short}
    </a>
  );
}
