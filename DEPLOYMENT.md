# Safety Deployment Checklist

## Closed

- `ConfidentialPayoutModule.sol` compiles against the real Nox protocol package.
- Live Sepolia USDC smoke test passes with a burner signer acting as `safe`.
- Sepolia USDC test token: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`.
- Sepolia Safe created: `0x81A397a3654e461A043B1DCf3591689873Be2a8C` (`Test` in Safe UI).
- Sepolia deploy module exists at `contracts/ignition/modules/ConfidentialPayoutModule.ts`.
- Sepolia deployment parameters exist at `contracts/ignition/parameters.sepolia.json`.
- Confidential payout module deployed: `0xDA61800A39739E1E32860dB58ecA7764bd5209eB`.
- Deployment addresses recorded at `contracts/deployments.sepolia.json`.

## Accounts

Current owner/deployer wallet:

```text
0xA3AEfB2adB03Bcf57033A0C4376361696Ab71517
```

Needed next:

```text
Verify Safe/module USDC balances, then approve and deposit from the Safe if needed.
```

## Deploy Module

Deploy:

```powershell
pnpm hardhat ignition deploy .\ignition\modules\ConfidentialPayoutModule.ts --network sepolia --parameters .\ignition\parameters.sepolia.json
```

## After Deploy

- Fund the Safe with Sepolia USDC.
- Approve the module to spend Safe-held USDC via a Safe transaction.
- Call `deposit(amount)` through the Safe.
- Encrypt a payout amount with Nox JS tooling.
- Call `requestPayout(recipient, amountHandle, amountProof)` through the Safe.
- Generate public decryption proofs for amount and debit success.
- Call `finalizePayout(requestId, amountDecryptionProof, debitSuccessDecryptionProof)` through the Safe.

## Current Sepolia Addresses

```text
USDC:   0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
Safe:   0x81A397a3654e461A043B1DCf3591689873Be2a8C
Module: 0xDA61800A39739E1E32860dB58ecA7764bd5209eB
```

## Prepare Safe Deposit Batch

First transfer Sepolia USDC to the Safe:

```text
0x81A397a3654e461A043B1DCf3591689873Be2a8C
```

Check current USDC balances:

```powershell
pnpm hardhat run .\scripts\check-usdc-balances.ts --network sepolia
```

Then generate a Safe Transaction Builder batch for `approve` + `deposit`:

```powershell
pnpm hardhat run .\scripts\prepare-safe-deposit.ts
```

Default deposit amount is 1 USDC. To generate a different amount:

```powershell
$env:DEPOSIT_USDC="5"; pnpm hardhat run .\scripts\prepare-safe-deposit.ts
```

Import the printed JSON in Safe Transaction Builder on Ethereum Sepolia and execute it from the Safe.

## Remaining Deliverables

- Full request/finalize integration test.
- Frontend contract wiring.
- README refresh.
- `feedback.md` for Nox tooling.
- Demo video.
- X post tagging `@iEx_ec`.
