---
sidebar_position: 2
title: Create a Safe
---

# Create a Safe

The Safety dashboard includes a built-in Safe creation flow. Users do not need to visit app.safe.global or run any deployment scripts manually.

## Using the Dashboard

1. Navigate to the dashboard at `/dashboard`.
2. Click **Create New Safe**.
3. Fill in the form:
   - **Owner addresses** — add one or more Ethereum addresses that will be signers.
   - **Threshold** — minimum number of signers required (M-of-N). Must be at most the total number of owners.
4. Click **Deploy Safe**.

The app will:
1. Call `/api/safe/create` → deploys a `SafeProxyFactory.createProxyWithNonce` transaction.
2. Wait for the transaction receipt and extract `safeAddress` from the `ProxyCreation` event.
3. Call `/api/safe/deploy-module` → deploys a `ConfidentialPayoutModule` initialized for this Safe.
4. Cache the module address in `localStorage`.
5. Redirect you to the dashboard with the new Safe loaded.

## What Gets Deployed

| Contract | Purpose |
|---|---|
| Gnosis Safe Proxy | Your multisig wallet |
| ConfidentialPayoutModule | Encrypted treasury for this Safe |

## Using an Existing Safe

If you already have a Safe:

1. Enter your Safe address in the input on the dashboard.
2. The app detects that the module address is not cached.
3. It calls `/api/safe/deploy-module` to deploy a module for your Safe.
4. You will then need to call `enableModule(moduleAddress)` on your Safe — the app prompts you to do this.

## Enabling the Module

If the module is not yet enabled on your Safe, the dashboard shows an **Enable Module** button. Click it to submit an `enableModule(moduleAddress)` transaction through `execTransaction`.

This is a one-time setup step. Once enabled, the module can be used for deposits and payouts indefinitely.

## Safe Proxy Factory Addresses

| Network | SafeProxyFactory Address |
|---|---|
| Ethereum Sepolia | `0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67` (Safe 1.4.1) |
| Arbitrum Sepolia | Same address (deterministic deployment) |
