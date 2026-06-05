"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { TxHashBadge } from "@/components/TxHashBadge";
import { useSubscription } from "@/hooks/useSubscription";
import { useWallet } from "@/hooks/useWallet";
import { api, LegacyMessage } from "@/lib/api";
import { encryptMessage, sha256Hex } from "@/lib/crypto";
import {
  encryptAttachment,
  formatFileSize,
  isVideoFile,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/attachments";
import type { MessageKind } from "@/lib/plans";
import {
  buildAnchorMessageTx,
  buildDeliveryTriggerTx,
  fundTestnetAccount,
  signAndSubmit,
} from "@/lib/stellar";

export default function MessagesPage() {
  return (
    <RequireAuth>
      <MessagesContent />
    </RequireAuth>
  );
}

function MessagesContent() {
  const wallet = useWallet();
  const { subscription, isPremium } = useSubscription();
  const [messages, setMessages] = useState<LegacyMessage[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [recipient, setRecipient] = useState("");
  const [body, setBody] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [messageKind, setMessageKind] = useState<MessageKind>("text");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const load = () => api.messages().then((r) => setMessages(r.messages));

  useEffect(() => {
    load();
  }, []);

  const createAndAnchor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Encrypting message…");
    try {
      if (attachment) {
        if (attachment.size > MAX_ATTACHMENT_BYTES) {
          throw new Error(`Attachment max ${formatFileSize(MAX_ATTACHMENT_BYTES)}`);
        }
        if (isVideoFile(attachment) && !isPremium) {
          throw new Error("Video farewell messages require Premium.");
        }
        if (!isPremium) {
          throw new Error("File attachments require Premium.");
        }
      }

      let attachmentEncrypted: string | undefined;
      let attachmentName: string | undefined;
      let attachmentMime: string | undefined;

      if (attachment) {
        setStatus("Encrypting attachment…");
        attachmentEncrypted = await encryptAttachment(attachment, passphrase);
        attachmentName = attachment.name;
        attachmentMime = attachment.type;
        if (isVideoFile(attachment)) {
          setMessageKind("video");
        }
      }

      const payload = JSON.stringify({
        body,
        kind: messageKind,
        attachmentName,
      });
      const encrypted = await encryptMessage(payload, passphrase);
      const contentHash = await sha256Hex(encrypted + (attachmentEncrypted ?? ""));

      setStatus("Connecting wallet…");
      let pk = wallet.publicKey;
      if (!pk) pk = await wallet.connect();
      await fundTestnetAccount(pk);

      setStatus("Anchoring hash on Stellar testnet…");
      const xdr = await buildAnchorMessageTx(pk, contentHash);
      const stellarTxHash = await signAndSubmit(xdr);

      setStatus("Saving message…");
      await api.createMessage({
        title,
        recipient,
        bodyEncrypted: encrypted,
        contentHash,
        stellarTxHash,
        messageKind: attachment && isVideoFile(attachment) ? "video" : messageKind,
        attachmentEncrypted,
        attachmentName,
        attachmentMime,
        type: "individual",
        status: "active",
      });

      setOpen(false);
      setTitle("");
      setRecipient("");
      setBody("");
      setPassphrase("");
      setMessageKind("text");
      setAttachment(null);
      setStatus(null);
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create message");
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async (message: LegacyMessage) => {
    setLoading(true);
    setStatus(`Delivering "${message.title}"…`);
    try {
      const consensus = await api.consensus(message.id);
      if (!consensus.ready) {
        const simulate = confirm(
          `Verifier consensus not reached (${consensus.votes}/${consensus.threshold}). Simulate delivery for demo?`,
        );
        if (simulate) {
          await api.simulateDelivery(message.id);
          await load();
          setStatus("Delivery simulated (demo mode)");
          return;
        }
        throw new Error("Consensus not reached");
      }

      let pk = wallet.publicKey;
      if (!pk) pk = await wallet.connect();
      await fundTestnetAccount(pk);
      const xdr = await buildDeliveryTriggerTx(pk, message.id);
      const hash = await signAndSubmit(xdr);
      await api.deliver(message.id, hash);
      await load();
      setStatus(`Delivered! Tx: ${hash.slice(0, 12)}…`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Delivery failed");
    } finally {
      setLoading(false);
    }
  };

  const kindLabel = (k?: string) => {
    if (k === "video") return "Video";
    if (k === "personalized") return "Personalized";
    return "Text";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted mt-1">
            Encrypt, hash, and anchor farewell messages on Stellar.
            {!isPremium && subscription && (
              <span className="block text-xs mt-1">
                Free plan: {subscription.usage.recipients}/
                {subscription.limits.maxRecipients} recipients · text only
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>New message</Button>
      </div>

      {!isPremium && (
        <Card className="py-3 border-accent/30 bg-accent/5 text-sm">
          Need video, attachments, or more recipients?{" "}
          <Link href="/subscription" className="text-accent hover:underline">
            Upgrade to Premium — $19.99/year
          </Link>
        </Card>
      )}

      {status && (
        <Card className="py-3 text-sm text-muted border-accent/30">{status}</Card>
      )}

      {messages.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-muted">No legacy messages yet.</p>
          <Button className="mt-4" onClick={() => setOpen(true)}>
            Create your first message
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <Card key={m.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{m.title}</h3>
                    <StatusBadge status={m.status} />
                    <span className="text-xs rounded-full bg-surface-elevated px-2 py-0.5 text-muted">
                      {kindLabel(m.messageKind)}
                    </span>
                    {m.attachmentName && (
                      <span className="text-xs text-accent">📎 {m.attachmentName}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted">Recipient: {m.recipient}</p>
                  <p className="font-mono text-xs text-muted break-all">
                    Hash: {m.contentHash.slice(0, 24)}…
                  </p>
                  <TxHashBadge hash={m.stellarTxHash} />
                </div>
                {m.status !== "delivered" && (
                  <Button
                    variant="secondary"
                    disabled={loading}
                    onClick={() => handleDeliver(m)}
                  >
                    Trigger delivery
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New legacy message">
        <form onSubmit={createAndAnchor} className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="Recipient name or email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
          />

          <label className="block space-y-1.5">
            <span className="text-sm text-muted">Message type</span>
            <select
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
              value={messageKind}
              onChange={(e) => setMessageKind(e.target.value as MessageKind)}
              disabled={!isPremium && messageKind === "text"}
            >
              <option value="text">Text message</option>
              <option value="personalized" disabled={!isPremium}>
                Personalized { !isPremium && "(Premium)" }
              </option>
              <option value="video" disabled={!isPremium}>
                Video farewell { !isPremium && "(Premium)" }
              </option>
            </select>
          </label>

          <Textarea
            label={messageKind === "personalized" ? "Personalized message" : "Message body"}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />

          {isPremium ? (
            <label className="block space-y-1.5">
              <span className="text-sm text-muted">
                Attachment (optional, max {formatFileSize(MAX_ATTACHMENT_BYTES)})
              </span>
              <input
                type="file"
                className="w-full text-sm text-muted"
                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <p className="text-xs text-muted">File attachments require Premium.</p>
          )}

          <Input
            label="Encryption passphrase (never stored on server)"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing…" : "Encrypt & anchor on Stellar"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
