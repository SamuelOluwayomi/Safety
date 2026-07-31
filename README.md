# Safety: Confidential Treasury Layer for Safe Smart Accounts

**WTF Hackathon Summer Edition Project**  
Powered by **iExec Nox (TEE Enclaves)** and **Gnosis Safe**

---

## Executive Summary

**Safety** adds a zero-compromise confidentiality layer on top of the Gnosis Safe multisig smart account framework using **iExec Nox**.

Standard Safe multisig transactions publicly log payout amounts and balances on-chain. Safety encrypts payout values off-chain via **iExec Nox Trusted Execution Environments (TEEs)** while preserving all existing Safe multisig approval flows, on-chain execution guarantees, and auditability.

---

## Key Features & New Improvements

### 1. In-App Safe Creation Flow (Zero External Setup)
- Users can create a brand new **Gnosis Safe 1.4.1** proxy wallet directly inside the Safety web console with zero friction.
- Configurable multisig signers and signature thresholds ($M$-of-$N$).
- Automatically deploys the Safe proxy via `SafeProxyFactory` and enables the `ConfidentialPayoutModule` in a 2-step setup flow.

### 2. Native Gnosis Safe Prevalidated Signatures (`v = 1`)
- Eliminates signature encoding errors (`GS026` / `GS013`) by using Gnosis Safe's native `buildPrevalidatedSig` (`v=1, r=ownerAddress, s=0`).
- Transactions execute cleanly on-chain without signature mismatches or extra off-chain message signature prompts.

### 3. Automated Network Switching & Multi-Network Duality
- Real-time network selector switching between **Arbitrum Sepolia (Chain ID 421614)** and **Ethereum Sepolia (Chain ID 11155111)**.
- Automatically prompts connected wallets (e.g. MetaMask) to switch networks when initiating transactions if the active chain differs from the target environment.

### 4. Interactive UX & Tooltips
- Onboarding guide banner breaking down the 3-step treasury workflow.
- Contextual **`?` Info Tooltip badges** on all inputs, tabs, and action buttons for instant in-app guidance.
- Clean layout with conditional footer suppression on the dashboard route (`/dashboard`).

---

## About Gnosis Safe & How Privacy is Added

### What is Gnosis Safe?
Gnosis Safe is the industry-standard smart contract multisig wallet on Ethereum and EVM chains. It requires multiple authorized signers to approve transactions before execution, ensuring high-security asset management for DAOs, organizations, and teams.

### How Privacy is Added (iExec Nox TEE)
1. **Client-Side Encryption**: When a payout is proposed, the payout amount is encrypted off-chain inside an iExec Nox TEE enclave into an `externalEuint256` handle.
2. **Encrypted On-Chain Accounting**: The `ConfidentialPayoutModule` receives the handle and uses `Nox.safeSub` to perform encrypted arithmetic on-chain without exposing the underlying plaintext amount.
3. **Selective Decryption Proofs**: Decryption permissions are strictly managed. Only authorized recipients or auditors can generate decryption proofs via iExec Nox to reveal amounts, while the public blockchain only sees encrypted bytes.
4. **Just-In-Time Settlement**: Upon finalization, a public decryption proof is verified on-chain, and standard ERC-20 tokens (e.g., USDC) are transferred directly to the recipient.

---

## Security & Treasury Isolation Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │          Connected Wallet (MetaMask)         │
                  └──────────────────────┬───────────────────────┘
                                         │
                         Proposes Payout & Encrypts via Nox
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            Gnosis Safe Smart Account          │
                  │   (Executes transaction via execTransaction) │
                  └──────────────────────┬───────────────────────┘
                                         │
                             onlySafe Modifier Check
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │          Confidential Payout Module          │
                  │   (Holds encrypted balance + USDC vault)     │
                  └──────────────────────┬───────────────────────┘
                                         │
                             Verifies Decryption Proof
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │               Recipient Wallet               │
                  │        (Receives plain USDC tokens)          │
                  └──────────────────────────────────────────────┘
```

### Access Control (`onlySafe`)
Every deposit, payout request, and finalization function in `ConfidentialPayoutModule.sol` is protected by the `onlySafe` modifier:
```solidity
modifier onlySafe() {
    require(msg.sender == safe, "not safe");
    _;
}
```

### Shared Testnet Demo vs. Production 1:1 Isolation
- **Testnet Hackathon Setup**: The deployed module on testnets is pre-funded with USDC so evaluators and judges can test confidential payouts immediately without needing to deploy and fund a custom Safe first.
- **Production Setup**: Every newly created Safe deploys its own dedicated `ConfidentialPayoutModule` contract instance. Each treasury starts with **0 USDC balance** and is **100% isolated** — no other Safe or address can access or request funds from another team's module.

---

## Deployed Smart Contracts Reference

### Arbitrum Sepolia Deployment
- **Chain ID**: 421614
- **Safe Prefix**: `arbsep`
- **Demo Safe Address**: `0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0`
- **Confidential Payout Module**: `0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4`
- **USDC Token Address**: `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`

### Ethereum Sepolia Deployment
- **Chain ID**: 11155111
- **Safe Prefix**: `sep`
- **Demo Safe Address**: `0x81A397a3654e461A043B1DCf3591689873Be2a8C`
- **Confidential Payout Module**: `0xDA61800A39739E1E32860dB58ecA7764bd5209eB`
- **USDC Token Address**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

---

## Smart Contract Functions Deep Dive

### `deposit(uint256 amount)`
Transfers standard ERC-20 tokens from the Safe into the module contract. Encrypts the deposited amount into a Nox `euint256` data structure and adds it to the internal encrypted balance using `Nox.toEuint256` and `Nox.add`.

### `requestPayout(address recipient, externalEuint256 amountHandle, bytes calldata amountProof)`
Called by the Safe via `execTransaction`. Invokes `Nox.fromExternal` to validate the encrypted handle and proof. Subtracts the requested amount from the internal encrypted balance using `Nox.safeSub`. Stores the pending payout request.

### `grantAuditorAccess(uint256 requestId, address auditor)`
Called by the Safe to grant specific auditor addresses view access to decrypt encrypted payout request handles.

### `finalizePayout(uint256 requestId, bytes calldata amountDecryptionProof, bytes calldata debitSuccessDecryptionProof)`
Validates public decryption proofs via `Nox.publicDecrypt`. Verifies that debit succeeded, marks the request as finalized, and transfers the plaintext amount of standard ERC-20 tokens directly to the recipient address.

---

## Quick Start Guide (Frontend UI)

### 1. Environment Setup
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://11155111.rpc.thirdweb.com
```

### 2. Launch Dev Server
```bash
cd frontend
pnpm dev
```

### 3. Usage Steps
1. Open `http://localhost:3000/dashboard`
2. Connect your wallet (MetaMask)
3. Choose to either:
   - **Create New Safe In-App**: Specify owners and threshold, click **Deploy Safe** (automatically enables module).
   - **Load Deployed Demo Safe**: Click to load pre-funded demo environment.
   - **Link Existing Safe**: Paste custom Gnosis Safe address.
4. Navigate to **Propose Payout** → enter recipient & amount → submit.
5. Navigate to **Signature Queue** → click **Finalize & Transfer** to execute settlement.

---

## License

MIT License. Created for the **iExec WTF Hackathon Summer Edition**.
