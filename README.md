# Safety — Confidential Treasury Layer for Safe

> **WTF !! Hackathon Summer Edition Project**  
> Powered by **iExec Nox** & **Safe (Gnosis Safe)**

---

## Executive Summary

**Safety** adds a zero-compromise confidentiality module on top of **Safe (multisig smart account framework)** using **iExec Nox (Trusted Execution Environments & Confidential Smart Contracts)**.

Standard Safe multisig transactions publicly log payout amounts on-chain. **Safety** encrypts payout values off-chain via Nox's TEE enclaves while preserving 100% of Safe's existing multisig approval flow, on-chain execution guarantees, and auditability.

---

## Architecture & System Design

```
+-----------------------------------------------------------------------+
|                            SAFE MULTISIG                              |
|   Signers approve proposed transaction via standard Safe workflow    |
+-----------------------------------+-----------------------------------+
                                    |
                                    v (Execute Module Call)
+-----------------------------------+-----------------------------------+
|                   CONFIDENTIAL PAYOUT MODULE                         |
|   - Keeps payout amount encrypted on-chain via Nox TEE               |
|   - Unwraps tokens JIT (Just-In-Time) upon execution                  |
|   - Grants ACL read access only to authorized recipients/auditors     |
+-----------------------------------+-----------------------------------+
                                    |
                                    v (Plain ERC-20 Payout)
+-----------------------------------+-----------------------------------+
|                        RECIPIENT WALLET                              |
+-----------------------------------------------------------------------+
```

### 1. `ERC7984ERC20Wrapper`
- Wraps standard ERC-20 tokens (e.g., USDC) into confidential balance tokens.
- Manages encrypted handles and balance state using the Nox protocol layer.

### 2. `ConfidentialPayoutModule.sol`
- A custom Safe module plugin.
- Allows Safe signers to approve payouts without broadcasting the exact transfer amounts on public block explorers.
- Executes payouts via Nox enclaves, unwrapping tokens JIT.

### 3. Safety Web Interface
- High-performance Next.js 16 frontend built with a **Classified Document / Brutalist** aesthetic.
- Connects to Web3 wallets via Wagmi/Viem and interacts with Safe SDK & Nox SDK.

---

## Tech Stack & Dependencies

- **Confidential Execution:** iExec Nox TEE, `@iexec-nox/nox-hardhat-plugin`
- **Smart Accounts:** Safe SDK (`@safe-global/protocol-kit`, `@safe-global/api-kit`)
- **Contracts Framework:** Hardhat 3, Viem, Solidity `^0.8.28`
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, React Query, Phosphor Icons

---

## Quickstart

### Prerequisites
- Node.js `^20.x` or `^22.x`
- `pnpm` (`^9.x` or higher)
- Docker Desktop (required for local Nox offchain stack)

### 1. Smart Contracts Setup

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
pnpm install

# Run Hardhat tests (launches local simulated node & Nox offchain stack)
pnpm hardhat test
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## License

MIT License. Built for the iExec WTF Hackathon.
