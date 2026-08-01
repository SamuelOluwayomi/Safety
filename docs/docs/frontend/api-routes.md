---
sidebar_position: 3
title: API Routes
---

# Next.js API Routes

The server-side API routes handle operations that require server-held secrets (private keys) or Node.js-only SDK access (`@iexec-nox/handle`). These run inside Next.js Route Handlers under `app/api/`.

## POST /api/nox/encrypt

Encrypts a plaintext USDC amount using the iExec Nox TEE client SDK.

**Request body:**

```json
{
  "amount": "28000000",
  "owner": "0xA3AEfB2adB03Bcf57033A0C4376361696Ab71517",
  "appContract": "0xDA61800A39739E1E32860dB58ecA7764bd5209eB",
  "chainId": 11155111
}
```

| Field | Type | Description |
|---|---|---|
| `amount` | string | Plaintext amount in token smallest unit (e.g. USDC 6 decimals) |
| `owner` | `0x${string}` | The Safe owner address (used as the "sender" identity in the Nox ACL) |
| `appContract` | `0x${string}` | The `ConfidentialPayoutModule` address (the "app" that can use the handle) |
| `chainId` | number | Chain ID — determines which RPC + private key is used server-side |

**Response:**

```json
{
  "handle": "0x0000aa36a72301e7fadb2c4a6342a15728ee7bc8fd8172279c8695ed1a7ca57c",
  "proof": "0x...bytes..."
}
```

**How it works internally:**

```typescript
const walletClient = createWalletClient({ account, chain, transport: http(rpc) });
const handleClient = await createViemHandleClient(walletClient);
const { handle, handleProof } = await handleClient.encryptInput(BigInt(amount), "uint256", appContract);
```

The server creates a viem wallet client using the deployer private key (`SEPOLIA_PRIVATE_KEY` or `ARBITRUM_SEPOLIA_PRIVATE_KEY`) and calls `encryptInput`. The resulting `handle` is a 32-byte ciphertext reference and `handleProof` is a TEE attestation signature.

:::warning Private key usage
This route uses the deployer private key to call the Nox TEE. The key is only used to sign the TEE encryption request — it does not sign or broadcast any blockchain transactions. The `owner` field in the request overrides the identity seen by the Nox ACL.
:::

## POST /api/nox/public-decrypt

Fetches public decryption proofs for an amount handle and a debit success handle from the Nox TEE.

**Request body:**

```json
{
  "handle": "0x0000aa36a7...",
  "debitHandle": "0x0000aa36a7...",
  "chainId": 11155111
}
```

**Response:**

```json
{
  "amountProof": "0x...",
  "debitSuccessProof": "0x..."
}
```

These proofs are passed directly as arguments to `finalizePayout(requestId, amountProof, debitSuccessProof)`.

## POST /api/safe/create

Deploys a new Gnosis Safe proxy using `SafeProxyFactory.createProxyWithNonce`.

**Request body:**

```json
{
  "owners": ["0xA3AEfB...", "0xB4CF..."],
  "threshold": 1,
  "networkKey": "sepolia"
}
```

**Response:**

```json
{
  "safeAddress": "0x..."
}
```

## POST /api/safe/deploy-module

Deploys and initializes a `ConfidentialPayoutModule` for a given Safe address if one does not already exist.

**Request body:**

```json
{
  "safeAddress": "0xA3AEfB...",
  "networkKey": "sepolia"
}
```

**Response:**

```json
{
  "moduleAddress": "0xDA61800A..."
}
```

**Server logic:**
1. Checks in-memory map for `networkKey:safeAddress`.
2. If not found, deploys `ConfidentialPayoutModule` bytecode.
3. Calls `initialize(usdcAddress, safeAddress)`.
4. Stores address in map and returns it.

:::note Server restart persistence
The in-memory map is lost on server restart. The client-side `localStorage` cache (`safety_module:networkKey:safeAddress`) is the persistent source of truth. The API is only called when the cache is empty.
:::
