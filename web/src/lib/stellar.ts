import {
  Asset,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
export const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

export const horizon = new Horizon.Server(HORIZON_URL);

const ANCHOR_AMOUNT = "0.0000001";

function hashHexToBuffer(hex: string): Buffer {
  const clean = hex.replace(/^0x/i, "");
  if (clean.length !== 64) {
    throw new Error("Content hash must be 32-byte SHA-256 (64 hex chars)");
  }
  return Buffer.from(clean, "hex");
}

function textMemo(prefix: string, payload: string): Memo {
  const text = `${prefix}:${payload}`.slice(0, 28);
  return Memo.text(text);
}

async function buildSelfPaymentTx(
  publicKey: string,
  memo: Memo,
): Promise<string> {
  const account = await horizon.loadAccount(publicKey);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: publicKey,
        asset: Asset.native(),
        amount: ANCHOR_AMOUNT,
      }),
    )
    .addMemo(memo)
    .setTimeout(180)
    .build();

  return tx.toXDR();
}

/** Anchor encrypted message hash on Stellar via MEMO_HASH self-payment. */
export async function buildAnchorMessageTx(
  publicKey: string,
  contentHashHex: string,
): Promise<string> {
  const hash = hashHexToBuffer(contentHashHex);
  return buildSelfPaymentTx(publicKey, Memo.hash(hash));
}

export async function buildVerifierVoteTx(
  publicKey: string,
  messageId: string,
  vote: "confirm" | "reject",
): Promise<string> {
  const shortId = messageId.replace(/-/g, "").slice(0, 12);
  return buildSelfPaymentTx(
    publicKey,
    textMemo(`V${vote === "confirm" ? "Y" : "N"}`, shortId),
  );
}

export async function buildActivityPingTx(publicKey: string): Promise<string> {
  const stamp = Date.now().toString(36).slice(-8);
  return buildSelfPaymentTx(publicKey, textMemo("PING", stamp));
}

export async function buildDeliveryTriggerTx(
  publicKey: string,
  messageId: string,
): Promise<string> {
  const shortId = messageId.replace(/-/g, "").slice(0, 12);
  return buildSelfPaymentTx(publicKey, textMemo("DLVR", shortId));
}

export async function signAndSubmit(xdr: string): Promise<string> {
  const freighter = await import("@stellar/freighter-api");
  const signed = await freighter.signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  if ("error" in signed && signed.error) {
    throw new Error(signed.error);
  }
  const signedXdr = signed.signedTxXdr;
  if (!signedXdr) throw new Error("No signed transaction returned");

  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const result = await horizon.submitTransaction(tx);
  return result.hash;
}

export function explorerTxUrl(hash: string): string {
  return `${EXPLORER_BASE}/tx/${hash}`;
}

export async function fundTestnetAccount(publicKey: string): Promise<void> {
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`,
  );
  if (!res.ok && res.status !== 400) {
    throw new Error("Friendbot funding failed");
  }
}
