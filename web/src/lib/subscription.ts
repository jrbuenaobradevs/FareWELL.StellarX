import {
  Asset,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { HORIZON_URL, NETWORK_PASSPHRASE } from "./stellar";

const horizon = new Horizon.Server(HORIZON_URL);

export interface PaymentConfig {
  priceUsd: number;
  amountStroops: string;
  usdcIssuer: string;
  recipient: string;
  network: string;
  memoPrefix: string;
}

export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const res = await fetch(`${apiUrl}/api/plans`);
  if (!res.ok) throw new Error("Could not load subscription pricing");
  return res.json();
}

export async function buildSubscriptionPaymentTx(
  publicKey: string,
  config: PaymentConfig,
  userId: string,
): Promise<string> {
  if (!config.recipient) {
    throw new Error(
      "Subscription wallet not configured on server (SUBSCRIPTION_WALLET_G)",
    );
  }

  const account = await horizon.loadAccount(publicKey);
  const usdc = new Asset("USDC", config.usdcIssuer);
  const amount = (Number(config.amountStroops) / 10_000_000).toFixed(7);
  const memoText = `${config.memoPrefix}${userId.replace(/-/g, "").slice(0, 20)}`.slice(
    0,
    28,
  );

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: config.recipient,
        asset: usdc,
        amount,
      }),
    )
    .addMemo(Memo.text(memoText))
    .setTimeout(180)
    .build();

  return tx.toXDR();
}

export async function ensureUsdcTrustline(publicKey: string, issuer: string) {
  const account = await horizon.loadAccount(publicKey);
  const hasLine = account.balances.some(
    (b) =>
      b.asset_type !== "native" &&
      "asset_code" in b &&
      b.asset_code === "USDC" &&
      b.asset_issuer === issuer,
  );
  if (hasLine) return null;

  const usdc = new Asset("USDC", issuer);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({ asset: usdc }))
    .setTimeout(180)
    .build();

  return tx.toXDR();
}
