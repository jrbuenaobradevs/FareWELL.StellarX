# FareWELL

A Stellar-native digital legacy app for encrypted farewell messages, trusted verifier delivery, and on-chain audit trails.

## Problem

Families often lose access to important final messages, instructions, and digital records when a loved one becomes inactive, incapacitated, or passes away. Existing tools either depend on centralized custody, require legal overhead, or provide no tamper-evident proof that a message existed before delivery.

FareWELL helps people prepare sensitive goodbye messages and inheritance-adjacent instructions without giving the app access to plaintext content. This is especially relevant in the Philippines, where many families are geographically distributed because of OFW work, migration, and provincial-city separation. A trusted, wallet-verifiable record can help families coordinate across distance while keeping private messages encrypted until delivery conditions are met.

## How It Works

1. A user creates an account and connects a Freighter testnet wallet.
2. The user writes a farewell message, sets a passphrase, and selects a recipient.
3. The browser encrypts the message with AES-256-GCM and hashes the encrypted payload.
4. The user signs a Stellar testnet transaction that anchors the message hash on-chain.
5. The user adds trusted verifiers who can confirm inactivity through a family portal.
6. The user can periodically log activity pings on Stellar.
7. When verifier consensus is reached, the app marks the message for delivery and records the event in the audit timeline.
8. Free users can create a limited legacy plan; Premium users pay an annual USDC subscription for expanded limits.

## How It Uses Stellar

FareWELL uses Stellar testnet for low-cost, user-signed audit signals:

- Message integrity anchoring: encrypted message hashes are recorded through Freighter-signed Stellar transactions using `MEMO_HASH`.
- Activity checks: user check-ins are recorded with memo transactions such as `PING:{timestamp}`.
- Verifier votes: trusted contacts submit confirmation votes with memo text such as `VY:{id}` or `VN:{id}`.
- Delivery events: delivery triggers are recorded with memo text such as `DLVR:{id}`.
- Premium subscription payment: Premium is paid with testnet USDC. The API verifies a $19.99 USDC payment to `SUBSCRIPTION_WALLET_G` through Horizon before activating the plan.
- Classic asset support: USDC payment requires the user to have a USDC trustline before sending the subscription payment.

Stellar is a good fit because the app needs inexpensive, fast, human-wallet-signed proofs rather than heavy smart contract execution. Classic Stellar payments and memos give the project a simple public audit trail while keeping message content encrypted and stored off-chain.

## Track

TBD - StellarX Philippines track.

Suggested fit: Social Impact / Consumer Apps, because FareWELL focuses on family preparedness, digital legacy, and trusted delivery.

## Tech Stack

- Framework: Next.js 16.2.6, React 19.2.4, TypeScript, Tailwind CSS v4
- API: Node.js, Express 4.21.2
- Stellar SDK: `@stellar/stellar-sdk` v15.1.0
- Wallet: Freighter via `@stellar/freighter-api` v6.0.1
- Network: Stellar testnet
- Data store: local JSON file store under `server/data/`
- Other dependencies: `cors`, `uuid`, `concurrently`

## Setup & Run

A judge can run the app locally with Node.js 20+, npm, and the Freighter browser extension set to Test Net.

```bash
git clone [your repo]
cd FareWELL

npm install
npm install --prefix server
npm install --prefix web

# Web environment
cp web/.env.local.example web/.env.local

# Server environment
cp server/.env.example server/.env
```

Environment variables:

```bash
# web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org

# server/.env
PORT=4000
HORIZON_URL=https://horizon-testnet.stellar.org
USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
SUBSCRIPTION_WALLET_G=your_testnet_g_address
```

Run both the API and web app:

```bash
npm run dev
```

Local URLs:

- App: `http://localhost:3001`
- API health check: `http://localhost:4000/health`

Demo flow:

1. Open `http://localhost:3001`.
2. Register or sign in with a name and email.
3. Connect Freighter on Stellar Test Net.
4. Add a trusted verifier.
5. Create a message and sign the anchor transaction.
6. Log an activity ping from the dashboard.
7. Open `/portal`, enter the message ID and verifier email, then submit a verifier vote.
8. Trigger delivery after consensus, or use the demo delivery flow for local judging.

Premium flow:

1. Set `SUBSCRIPTION_WALLET_G` in `server/.env` to the testnet G address that should receive Premium USDC payments.
2. Make sure the paying wallet has a USDC trustline.
3. Go to `/subscription`.
4. Pay $19.99 testnet USDC through Freighter.
5. The API verifies the Horizon transaction and activates Premium for one year.

## Network Details

- Network: Stellar testnet
- Horizon URL: `https://horizon-testnet.stellar.org`
- RPC URL: Not used in the current MVP
- Contract IDs: None
- Asset issuers:
  - Testnet USDC issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- Payment recipient:
  - Configured by `SUBSCRIPTION_WALLET_G` in `server/.env`
- Explorer: `https://stellar.expert/explorer/testnet`

## Team

- TBD - @your-github-username

## License

Apache 2.0
