---
sidebar_position: 2
title: React Hooks
---

# React Hooks

All custom hooks live in `frontend/lib/hooks/`. Each hook encapsulates one stage of the payout lifecycle or Safe management flow.

## useDeploySafe

**File:** `lib/hooks/useDeploySafe.ts`

Deploys a new Gnosis Safe 1.4.1 proxy and immediately deploys + links a `ConfidentialPayoutModule` for it.

**What it does:**
1. Calls `/api/safe/create` to deploy a `SafeProxyFactory`-derived proxy with specified owners and threshold.
2. Calls `/api/safe/deploy-module` to deploy and initialize a `ConfidentialPayoutModule` for the new Safe.
3. Caches the module address in localStorage via `setCachedModule`.

```typescript
const { deploySafe, isLoading, error, result } = useDeploySafe(deployment);

await deploySafe({
  owners: ["0xA3...", "0xB4..."],
  threshold: 1,
});
// result: { safeAddress, moduleAddress }
```

## useDepositToTreasury

**File:** `lib/hooks/useDepositToTreasury.ts`

Executes a USDC deposit from the Safe into its linked `ConfidentialPayoutModule`.

**Steps executed:**
1. Resolves module address from localStorage or API.
2. Builds ERC-20 `approve(module, amount)` calldata and executes via Safe `execTransaction`.
3. Builds `deposit(amount)` calldata and executes via Safe `execTransaction`.
4. First deposit triggers the lazy-init of `encryptedBalance` inside the module.

```typescript
const { deposit, isLoading, txHash } = useDepositToTreasury(deployment, safeAddress);

await deposit({ amount: "28000000" }); // 28 USDC (6 decimals)
```

## useEnableModule

**File:** `lib/hooks/useEnableModule.ts`

Enables the `ConfidentialPayoutModule` on the Safe by calling `enableModule(moduleAddress)` through `execTransaction`.

```typescript
const { enableModule, isEnabled, isLoading } = useEnableModule(deployment, safeAddress, moduleAddress);

await enableModule();
```

## useProposePayout

**File:** `lib/hooks/useProposePayout.ts`

Encrypts a payout amount and submits a `requestPayout` transaction through the Safe.

**Steps:**
1. POSTs to `/api/nox/encrypt` to get `{ handle, proof }`.
2. Computes `safeTxHash` via `getTransactionHash`.
3. Calls `approveHash(safeTxHash)`.
4. Calls `execTransaction` with `requestPayout(recipient, handle, proof)` calldata.

```typescript
const { propose, isLoading, error } = useProposePayout(deployment, safeAddress);

await propose({
  recipient: "0xRecipient...",
  amountUsdc: "50",           // human-readable (not in wei)
});
```

## useFinalizePayout

**File:** `lib/hooks/useFinalizePayout.ts`

Fetches public decryption proofs and submits `finalizePayout` through the Safe.

**Steps:**
1. Resolves module address from localStorage.
2. Reads `pendingPayouts[requestId]` to get `amount` and `debitSuccess` handles.
3. POSTs handles to `/api/nox/public-decrypt` to get proofs.
4. Calls `approveHash` then `execTransaction → finalizePayout(requestId, amountProof, debitProof)`.

```typescript
const { finalize, isLoading, txHash } = useFinalizePayout(deployment);

await finalize(payout, safeAddress);
```

## usePayouts

**File:** `lib/hooks/usePayouts.ts`

Reads all pending payouts from a `ConfidentialPayoutModule` by polling `nextRequestId` and fetching each `pendingPayouts[i]`.

```typescript
const { payouts, isLoading, refetch } = usePayouts(deployment, moduleAddress);

// payouts: OnChainPayout[]
// [{ requestId, recipient, amount (bytes32), debitSuccess (bytes32), finalized }]
```

**Note:** `amount` and `debitSuccess` are returned as opaque `bytes32` handles. They are only resolved to plaintext during `finalizePayout`.

## useSafeData

**File:** `lib/hooks/useSafeData.ts`

Reads Safe metadata and USDC balance via `useReadContracts`.

```typescript
const { owners, threshold, nonce, usdcBalance, isModuleEnabled, isLoading } =
  useSafeData(deployment, safeAddress, moduleAddress);
```

Returns:
- `owners` — array of signer addresses
- `threshold` — required signature count
- `nonce` — current Safe transaction nonce
- `usdcBalance` — USDC balance of the Safe wallet (not the module)
- `isModuleEnabled` — whether the module is enabled on the Safe
