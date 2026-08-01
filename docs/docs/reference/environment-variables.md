---
sidebar_position: 1
title: Environment Variables
---

# Environment Variables

All frontend environment variables live in `frontend/.env.local`. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Variables without this prefix are server-only.

## Required Variables

| Variable | Type | Description |
|---|---|---|
| `NEXT_PUBLIC_CHAIN_ID` | number | Default chain ID. `11155111` for Sepolia, `421614` for Arbitrum Sepolia. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | string | WalletConnect project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com) |

## RPC URLs

| Variable | Type | Description |
|---|---|---|
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | string | Public HTTP RPC for Ethereum Sepolia |
| `NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL` | string | Public HTTP RPC for Arbitrum Sepolia |

## Deployer Keys (Server-Side Only)

These keys are used exclusively by the Next.js API routes to sign Nox SDK requests and deploy contracts. They never appear in the browser.

| Variable | Type | Description |
|---|---|---|
| `SEPOLIA_PRIVATE_KEY` | `0x${string}` | Private key for Sepolia transactions (Nox encryption signing, Safe/module deployment) |
| `ARBITRUM_SEPOLIA_PRIVATE_KEY` | `0x${string}` | Private key for Arbitrum Sepolia transactions |
| `DEPLOYER_PRIVATE_KEY` | `0x${string}` | Fallback deployer key used when network-specific key is not set |

:::caution
Never commit private keys to version control. Add `.env.local` to `.gitignore`. The deployer account should hold only testnet funds needed for gas.
:::

## Example .env.local

```bash
# Network
NEXT_PUBLIC_CHAIN_ID=11155111

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123...

# RPC URLs
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://11155111.rpc.thirdweb.com
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# Server-only keys
SEPOLIA_PRIVATE_KEY=0x...
ARBITRUM_SEPOLIA_PRIVATE_KEY=0x...
DEPLOYER_PRIVATE_KEY=0x...
```

## Contracts .env

The `contracts/.env` file is separate and used only for Hardhat deployment scripts:

```bash
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
SEPOLIA_PRIVATE_KEY=0x...
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
DEPLOYER_PRIVATE_KEY=0x...
```
