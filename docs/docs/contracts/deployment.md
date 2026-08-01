---
sidebar_position: 3
title: Deployment
---

# Contract Deployment

## Prerequisites

Before deploying, make sure the contracts project is set up:

```bash
cd contracts
npm install
npx hardhat compile
```

Required environment variables in `contracts/.env`:

```bash
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
SEPOLIA_PRIVATE_KEY=0x...
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
DEPLOYER_PRIVATE_KEY=0x...
```

## Step 1: Deploy the Master Module Implementation

Deploys the `ConfidentialPayoutModule` bytecode (the master copy used by the factory):

```bash
npx hardhat run scripts/deploy-module.ts --network sepolia
```

This writes the deployed address to `deployments.sepolia.json`:

```json
{
  "confidentialPayoutModule": "0xDA61800A39739E1E32860dB58ecA7764bd5209eB",
  "usdc": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
}
```

## Step 2: Deploy the Factory

The factory stores a mapping of `safeAddress → moduleAddress` and deploys new module instances on demand:

```bash
npx hardhat run scripts/deploy-factory.ts --network sepolia
```

Updates `deployments.sepolia.json` with:

```json
{
  "confidentialPayoutModule": "0xDA61800A...",
  "usdc": "0x1c7D4B...",
  "factory": "0xd56b800f38a80e2ffd9c2c2b7476a4c15915a44f"
}
```

## Step 3: Deploy a Module for a Specific Safe

To deploy a dedicated module for a given Safe address (without using the factory):

```bash
SAFE_ADDRESS=0xYourSafeAddress npx hardhat run scripts/deploy-module-for-safe.ts --network sepolia
```

This script:
1. Deploys a new `ConfidentialPayoutModule` instance.
2. Calls `initialize(usdcAddress, safeAddress)` on it.
3. Prints the deployed module address to copy into the frontend.

## Hardhat Configuration

`hardhat.config.ts` uses the `@iexec-nox/hardhat-plugin` for Nox-aware compilation:

```typescript
import "@iexec-nox/hardhat-plugin";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.35",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY],
    },
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    },
  },
};
```

## Deployment Files

| File | Purpose |
|---|---|
| `deployments.sepolia.json` | Stores live addresses for Ethereum Sepolia |
| `deployments.arbitrum-sepolia.json` | Stores live addresses for Arbitrum Sepolia |

## Updating Frontend Addresses

After deployment, update `frontend/lib/deployments.ts` with the new addresses:

```typescript
sepolia: {
  addresses: {
    module: "0xDA61800A39739E1E32860dB58ecA7764bd5209eB",
    safe:   "0x81A397a3654e461A043B1DCf3591689873Be2a8C",
    usdc:   "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    factory:"0xd56b800f38a80e2ffd9c2c2b7476a4c15915a44f",
  },
},
```
