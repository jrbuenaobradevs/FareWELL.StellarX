import { PREMIUM_USDC_STROOPS } from './plans.js';

const HORIZON =
  process.env.HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
const USDC_ISSUER =
  process.env.USDC_ISSUER ??
  'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const PAYMENT_RECIPIENT = process.env.SUBSCRIPTION_WALLET_G ?? '';

export async function verifyPremiumPayment(txHash, expectedPayer) {
  if (!PAYMENT_RECIPIENT) {
    return {
      ok: false,
      error: 'Subscription wallet not configured (SUBSCRIPTION_WALLET_G)',
    };
  }

  const res = await fetch(`${HORIZON}/transactions/${txHash}/operations`);
  if (!res.ok) {
    return { ok: false, error: 'Transaction not found on Horizon' };
  }

  const body = await res.json();
  const payment = body._embedded?.records?.find(
    (op) =>
      op.type === 'payment' &&
      op.to === PAYMENT_RECIPIENT &&
      op.asset_type !== 'native' &&
      op.asset_code === 'USDC' &&
      op.asset_issuer === USDC_ISSUER &&
      op.amount === formatUsdcAmount(PREMIUM_USDC_STROOPS),
  );

  if (!payment) {
    return {
      ok: false,
      error: `Expected USDC payment of $19.99 to ${PAYMENT_RECIPIENT}`,
    };
  }

  if (expectedPayer && payment.from !== expectedPayer) {
    return { ok: false, error: 'Payment must come from your linked wallet' };
  }

  const txRes = await fetch(`${HORIZON}/transactions/${txHash}`);
  if (!txRes.ok) {
    return { ok: false, error: 'Could not load transaction' };
  }
  const tx = await txRes.json();
  const memo = tx.memo_type === 'text' ? tx.memo : '';
  if (!memo.startsWith('SUB:')) {
    return { ok: false, error: 'Payment memo must start with SUB:' };
  }

  return { ok: true, payer: payment.from, memo };
}

function formatUsdcAmount(stroops) {
  const n = BigInt(stroops);
  const whole = n / 10_000_000n;
  const frac = n % 10_000_000n;
  return `${whole}.${frac.toString().padStart(7, '0')}`;
}

export function subscriptionExpiresAtOneYear() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

export function getPaymentConfig() {
  return {
    priceUsd: 19.99,
    amountStroops: PREMIUM_USDC_STROOPS,
    usdcIssuer: USDC_ISSUER,
    recipient: PAYMENT_RECIPIENT,
    network: 'testnet',
    memoPrefix: 'SUB:',
  };
}
