---
sidebar_position: 1
title: Tech Stack
---

# Frontend Tech Stack

The Safety frontend is a Next.js 15 application using the App Router.

## Core Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 15.x | React framework with App Router and server components |
| `react` | 19.x | UI library |
| `wagmi` | 2.x | React hooks for Ethereum wallet interactions |
| `viem` | 2.x | Low-level EVM client (ABI encoding, RPC calls, wallet clients) |
| `@rainbow-me/rainbowkit` | 2.x | Wallet connection modal and provider |
| `@iexec-nox/handle` | latest | Client SDK for encrypting inputs via the Nox TEE |
| `@tanstack/react-query` | 5.x | Async state management for Wagmi hooks |
| `zustand` | 4.x | Lightweight client state management |

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   ├── nox/
│   │   │   ├── encrypt/route.ts          Server-side Nox encryption
│   │   │   └── public-decrypt/route.ts   Server-side public decryption
│   │   └── safe/
│   │       ├── create/route.ts           Safe creation (proxy deploy)
│   │       └── deploy-module/route.ts    Module deployment per Safe
│   ├── dashboard/
│   │   └── page.tsx                      Treasury console
│   └── page.tsx                          Landing page
├── components/
│   ├── dashboard/
│   │   ├── DashboardView.tsx             Main treasury dashboard
│   │   ├── ProposePayoutForm.tsx         Payout proposal form
│   │   └── PayoutHistory.tsx             Payout ledger
│   ├── safe/
│   │   └── CreateSafeForm.tsx            Safe creation wizard
│   └── layout/
│       └── Navbar.tsx                    Navigation header
├── lib/
│   ├── chains.ts                         Wagmi chain config
│   ├── contracts.ts                      ABIs + default addresses
│   ├── deployments.ts                    Network deployment configs
│   ├── hooks/
│   │   ├── useDeploySafe.ts              Create + deploy Gnosis Safe
│   │   ├── useDepositToTreasury.ts       Deposit USDC into module
│   │   ├── useEnableModule.ts            Enable module on Safe
│   │   ├── useFinalizePayout.ts          Finalize pending payout
│   │   ├── usePayouts.ts                 Read payout queue from module
│   │   ├── useProposePayout.ts           Propose encrypted payout
│   │   └── useSafeData.ts               Read Safe metadata
│   ├── stores/
│   │   └── useNetworkStore.ts            Network selection store (Zustand)
│   └── utils/
│       └── module-cache.ts               localStorage module address cache
└── .env.local
```

## Environment Variables

See [Environment Variables](/reference/environment-variables) for the full list of required variables.

## Wagmi Configuration

Wagmi is configured in `lib/wagmi/` with:
- `arbitrumSepolia` and `sepolia` chains
- HTTP transports using configured RPC URLs
- RainbowKit connector

```typescript
const config = createConfig({
  chains: [arbitrumSepolia, sepolia],
  transports: {
    [arbitrumSepolia.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  },
});
```

## State Management

| State Layer | Tool | Scope |
|---|---|---|
| Server data (contracts) | Wagmi `useReadContract` / `useWriteContract` | Per component |
| Async loading states | TanStack Query | Per hook |
| Network selection | Zustand `useNetworkStore` | Global client |
| Module addresses | `localStorage` via `module-cache.ts` | Persistent client |
