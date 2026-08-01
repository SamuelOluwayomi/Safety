---
sidebar_position: 1
title: Quickstart
---

# Quickstart

This guide gets the full Safety stack running locally in under 10 minutes.

## Prerequisites

- Node.js 18+
- pnpm 8+ (frontend) or npm (contracts, docs)
- MetaMask or any EIP-1193 wallet
- Sepolia or Arbitrum Sepolia testnet ETH
- Testnet USDC (see [faucets](#testnet-tokens))

## 1. Clone and Install

```bash
git clone https://github.com/SamuelOluwayomi/Safety.git
cd safety
```

Install frontend dependencies:

```bash
cd frontend
pnpm install
```

Install contract dependencies:

```bash
cd ../contracts
npm install
```

## 2. Configure Environment

Copy and fill in the frontend env file:

```bash
cd frontend
cp .env.example .env.local
```

Minimum required variables:

```bash
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-walletconnect-id>
SEPOLIA_PRIVATE_KEY=0x<deployer-private-key>
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://11155111.rpc.thirdweb.com
```

See [Environment Variables](/reference/environment-variables) for the full list.

## 3. Start the Frontend

```bash
cd frontend
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4. Connect Wallet

1. Click **Connect Wallet** in the top-right.
2. Select your wallet (MetaMask, Coinbase Wallet, etc.).
3. Switch to **Ethereum Sepolia** or **Arbitrum Sepolia**.

## 5. Create or Import a Safe

To create a new Safe:
- Click **Create New Safe** on the dashboard.
- Enter owner addresses and threshold.
- Click **Deploy Safe** — this deploys the Safe proxy and its linked module in one flow.

To use an existing Safe:
- Enter your Safe address in the input field.
- The app will resolve or deploy the linked module automatically.

## 6. Deposit USDC

1. Make sure your Safe wallet holds testnet USDC.
2. Click **Deposit** and enter an amount.
3. Approve two transactions: ERC-20 `approve` then `deposit`.

## 7. Propose a Payout

1. Click **Propose Payout**.
2. Enter recipient address and amount.
3. The app encrypts the amount server-side and submits via Safe `execTransaction`.

## 8. Finalize the Payout

Once enough signers have approved:
1. Find the pending payout in the queue.
2. Click **Finalize**.
3. The app fetches decryption proofs from the Nox TEE and submits `finalizePayout`.

## Testnet Tokens

| Network | USDC Address | Faucet |
|---|---|---|
| Ethereum Sepolia | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | [Circle Faucet](https://faucet.circle.com/) |
| Arbitrum Sepolia | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` | [Circle Faucet](https://faucet.circle.com/) |

For Sepolia ETH: [Alchemy Faucet](https://sepoliafaucet.com/) or [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet).
