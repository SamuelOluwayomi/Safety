---
sidebar_position: 1
title: Architecture Overview
---

# Architecture Overview

Safety is composed of three distinct layers that work together to deliver confidential treasury payouts:

1. **Smart Contract Layer** — The `ConfidentialPayoutModule` deployed per Safe.
2. **TEE Layer** — iExec Nox TEE enclaves that handle encrypted arithmetic and proof generation.
3. **Application Layer** — The Next.js frontend and server-side API routes that bridge user actions to on-chain calls.

## System Architecture Diagram

```mermaid
graph TB
    subgraph Browser ["User Browser"]
        UI["Dashboard UI\n(React + Wagmi)"]
    end

    subgraph NextJS ["Next.js Server"]
        ENC["/api/nox/encrypt"]
        DEC["/api/nox/public-decrypt"]
        DEPLOY["/api/safe/deploy-module"]
    end

    subgraph NoxTEE ["iExec Nox TEE Enclaves"]
        ENCLAVE["Nox TEE Hardware\n(Intel SGX)"]
    end

    subgraph Blockchain ["EVM Blockchain (Sepolia / Arb Sepolia)"]
        SAFE["Gnosis Safe Proxy\n(execTransaction)"]
        MOD["ConfidentialPayoutModule\n(per Safe)"]
        USDC["USDC ERC-20 Token"]
        NOXC["NoxCompute Contract\n(on-chain verifier)"]
    end

    UI -->|"1. POST amount + owner + appContract"| ENC
    ENC -->|"encryptInput()"| ENCLAVE
    ENCLAVE -->|"{ handle, proof }"| ENC
    ENC -->|"{ handle, proof }"| UI

    UI -->|"2. approveHash(txHash)"| SAFE
    UI -->|"3. execTransaction → requestPayout"| SAFE
    SAFE -->|"onlySafe"| MOD
    MOD -->|"Nox.fromExternal(handle, proof)"| NOXC
    MOD -->|"Nox.safeSub(balance, amount)"| NOXC
    NOXC -->|"euint256 result"| MOD

    UI -->|"4. POST requestId + handles"| DEC
    DEC -->|"publicDecrypt()"| ENCLAVE
    ENCLAVE -->|"{ amountProof, debitProof }"| DEC
    DEC -->|"{ amountProof, debitProof }"| UI

    UI -->|"5. execTransaction → finalizePayout"| SAFE
    SAFE -->|"onlySafe"| MOD
    MOD -->|"Nox.publicDecrypt(debitSuccess)"| NOXC
    MOD -->|"Nox.publicDecrypt(amount)"| NOXC
    MOD -->|"safeTransfer(recipient, plaintext)"| USDC
```

## Layer Responsibilities

### Browser Layer

The browser handles all user interactions, wallet connections, and orchestrates the multi-step payout flow:

- Reads Safe state (owners, threshold, module enabled status, USDC balance) using Wagmi `useReadContract` hooks.
- Calls the Next.js API to encrypt amounts before they are included in Safe transaction calldata.
- Signs and broadcasts `approveHash` and `execTransaction` calls using Wagmi's `useWriteContract`.
- Resolves the correct `ConfidentialPayoutModule` address per Safe from `localStorage` cache.

### Next.js API Layer

The server handles operations that require the `@iexec-nox/handle` SDK, which requires a wallet client to sign TEE requests:

- `/api/nox/encrypt` — Takes a plaintext amount and returns `(handle, proof)` pair via `handleClient.encryptInput()`.
- `/api/nox/public-decrypt` — Takes encrypted handles and returns public decryption proofs via the Nox TEE.
- `/api/safe/deploy-module` — Deploys a new `ConfidentialPayoutModule` instance for a given Safe address if one does not exist.

### Smart Contract Layer

The `ConfidentialPayoutModule` runs on-chain and contains all treasury accounting logic:

- Maintains an encrypted USDC balance (`euint256 encryptedBalance`).
- Validates encrypted payout requests via `Nox.fromExternal`.
- Performs encrypted balance deduction via `Nox.safeSub` and `Nox.select`.
- Settles payouts by verifying public decryption proofs and calling `IERC20.safeTransfer`.

## Module Isolation Per Safe

Each Gnosis Safe gets its own dedicated `ConfidentialPayoutModule` deployment. This provides:

- Complete balance isolation between different Safe treasuries.
- No shared encrypted state between organizations.
- Independent USDC balances and payout queues per Safe.

```mermaid
graph LR
    S1["Safe A\n0x9064..."] --> M1["Module A\n0xC3B7..."]
    S2["Safe B\n0x81A3..."] --> M2["Module B\n0xDA61..."]
    S3["Safe C (Custom)\n0xAC5b..."] --> M3["Module C\n(deployed on demand)"]

    M1 --> USDC["USDC Token Contract"]
    M2 --> USDC
    M3 --> USDC
```

## Data Flow Summary

| Step | Actor | Action | Result |
|---|---|---|---|
| 1 | Browser → API | POST amount to `/api/nox/encrypt` | Returns `handle` + `proof` |
| 2 | Browser → Safe | `approveHash(safeTxHash)` | Signer approval registered |
| 3 | Browser → Safe | `execTransaction → requestPayout` | `PendingPayout` stored on-chain |
| 4 | Browser → API | POST handles to `/api/nox/public-decrypt` | Returns decryption proofs |
| 5 | Browser → Safe | `execTransaction → finalizePayout` | USDC transferred to recipient |
