# FareWELL Pitch Deck

## 1. Title

# FareWELL

Stellar-native digital legacy messages with encrypted storage, trusted verifier delivery, and on-chain proof.

---

## 2. Problem

Important final messages, family instructions, and sensitive digital records are often lost, inaccessible, or disputed when someone becomes inactive, incapacitated, or passes away.

This is especially painful for Filipino families spread across cities, provinces, and overseas work. Loved ones may need trusted instructions, but the sender also needs privacy, control, and proof that the message existed before delivery.

---

## 3. Solution

FareWELL lets users prepare encrypted farewell messages and anchor proof of those messages on Stellar.

Users can:

- Write private messages for loved ones.
- Encrypt content in the browser before it reaches the server.
- Anchor message integrity on Stellar testnet.
- Add trusted verifiers who confirm inactivity.
- Record activity check-ins on-chain.
- Trigger delivery only after verifier consensus.

---

## 4. Product Flow

1. User registers and connects Freighter.
2. User creates a message and chooses a recipient.
3. Browser encrypts the message and hashes the encrypted payload.
4. User signs a Stellar transaction to anchor the hash.
5. User adds trusted verifiers.
6. User periodically logs activity pings.
7. Verifiers confirm inactivity through the family portal.
8. Message delivery is triggered after consensus.

---

## 5. Why Now

Digital life is becoming part of family life: wallets, documents, memories, instructions, passwords, and personal messages all live online.

Most people do not have a practical digital legacy plan. Existing options are either too legal-heavy, too centralized, or too hard to verify.

FareWELL makes digital legacy planning simple, private, and wallet-verifiable.

---

## 6. How FareWELL Uses Stellar

FareWELL uses Stellar testnet for low-cost, user-signed audit events:

- `MEMO_HASH` for encrypted message integrity anchoring.
- `MEMO_TEXT` activity pings such as `PING:{timestamp}`.
- `MEMO_TEXT` verifier votes such as `VY:{id}` and `VN:{id}`.
- `MEMO_TEXT` delivery triggers such as `DLVR:{id}`.
- Testnet USDC payments for Premium subscriptions.
- USDC trustline checks before subscription payment.

Stellar is ideal because the app needs fast, inexpensive, public proofs without storing private message content on-chain.

---

## 7. Business Model

FareWELL has a freemium model.

Free plan:

- Up to 3 recipients.
- Text messages only.
- 1 verifier.
- Fixed activity interval.

Premium plan:

- $19.99/year paid in USDC.
- Unlimited recipients.
- Unlimited verifiers.
- Attachments.
- Custom activity intervals.
- Additional message types.

---

## 8. MVP Features

Built MVP includes:

- Next.js web app.
- Express API.
- Freighter wallet connection.
- Client-side AES-256-GCM encryption.
- SHA-256 content hashing.
- Stellar testnet anchoring.
- Verifier management.
- Family verification portal.
- Activity ping timeline.
- Premium subscription flow using testnet USDC.
- Demo activation mode for local judging.

---

## 9. Demo

1. Open the app and register.
2. Connect Freighter on Stellar Test Net.
3. Add a trusted verifier.
4. Create an encrypted message.
5. Sign the Stellar anchor transaction.
6. Show the audit timeline.
7. Log an activity ping.
8. Open the verifier portal and submit a vote.
9. Trigger delivery after consensus.
10. Show Premium subscription page and USDC payment configuration.

---

## 10. Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Backend: Node.js, Express
- Wallet: Freighter
- Stellar SDK: `@stellar/stellar-sdk` v15.1.0
- Network: Stellar testnet
- Storage: local JSON database for MVP
- Payments: testnet USDC through classic Stellar payments

---

## 11. Network Details

- Network: Stellar testnet
- Horizon: `https://horizon-testnet.stellar.org`
- Explorer: `https://stellar.expert/explorer/testnet`
- Testnet USDC issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- Premium recipient: configured with `SUBSCRIPTION_WALLET_G`
- Contract IDs: none in MVP

---

## 12. Roadmap

Next steps:

- Add encrypted attachment storage backed by production object storage.
- Add email notifications for verifiers and recipients.
- Add stronger identity checks for verifier access.
- Add Soroban-based policy logic for delivery conditions.
- Add recovery and estate-planning templates.
- Add support for mainnet stablecoin payments.
- Add mobile-first offline message drafting.

---

## 13. Impact

FareWELL gives families a practical way to prepare for hard moments before they happen.

It protects message privacy, creates tamper-evident proof, and gives trusted people a clear process for confirming when delivery should happen.

For distributed Filipino families, it can turn digital legacy planning from an uncomfortable legal chore into a simple, compassionate workflow.

---

## 14. Ask

We are looking for:

- Feedback from StellarX judges and mentors.
- Support refining the Stellar payment and audit model.
- Guidance on privacy, identity, and verifier UX.
- Partnerships with family, legal-tech, and digital estate planning communities.

---

## 15. Closing

FareWELL helps people leave messages that are private while they live, verifiable when it matters, and deliverable when loved ones need them most.
