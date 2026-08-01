---
sidebar_position: 2
title: Deployed Addresses
---

# Deployed Addresses

## Ethereum Sepolia (Chain ID 11155111)

| Contract | Address |
|---|---|
| ConfidentialPayoutModule (demo) | `0xDA61800A39739E1E32860dB58ecA7764bd5209eB` |
| Demo Safe | `0x81A397a3654e461A043B1DCf3591689873Be2a8C` |
| ConfidentialPayoutFactory | `0xd56b800f38a80e2ffd9c2c2b7476a4c15915a44f` |
| USDC (testnet) | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |

Sepolia block explorer: [sepolia.etherscan.io](https://sepolia.etherscan.io)

## Arbitrum Sepolia (Chain ID 421614)

| Contract | Address |
|---|---|
| ConfidentialPayoutModule (demo) | `0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4` |
| Demo Safe | `0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0` |
| USDC (testnet) | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |

Arbitrum Sepolia block explorer: [sepolia.arbiscan.io](https://sepolia.arbiscan.io)

## Gnosis Safe Factory Addresses (Canonical)

These are the standard Safe 1.4.1 factory contracts deployed on all major networks at the same deterministic address:

| Contract | Address |
|---|---|
| SafeProxyFactory 1.4.1 | `0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67` |
| GnosisSafe 1.4.1 (singleton) | `0x41675C099F32341bf84BFc5382aF534df5C7461a` |
| CompatibilityFallbackHandler | `0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99` |

## Nox Protocol Contracts

The `NoxCompute` on-chain verifier contract is deployed by iExec on both testnets. The address is built into the `@iexec-nox/nox-protocol-contracts` package and resolved automatically via `import Nox from "..."` in Solidity. No manual configuration is needed.

## Custom Module Addresses

Each custom Safe deployed through the Safety app gets its own `ConfidentialPayoutModule` at a unique address. These addresses are:

1. Returned by `/api/safe/deploy-module` at deploy time.
2. Cached in `localStorage` under `safety_module:<networkKey>:<safeAddress>`.
3. Viewable in the browser DevTools under Application → Local Storage.
