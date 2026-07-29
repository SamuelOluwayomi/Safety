# Safety Deployment Checklist

## Active Target

Arbitrum Sepolia is now the active end-to-end target because current Nox handle SDK support resolves correctly for Arbitrum Sepolia.

```text
Network: Arbitrum Sepolia
Chain ID: 421614
Safe prefix: arbsep
Explorer: https://sepolia.arbiscan.io
```

No mock token should be used. Use a real public Arbitrum Sepolia ERC-20 faucet token or another real ERC-20 already deployed on Arbitrum Sepolia.

## Closed On Ethereum Sepolia

These prove the Safe/module/deposit plumbing, but Ethereum Sepolia is not the active Nox end-to-end target.

- `ConfidentialPayoutModule.sol` compiles against the real Nox protocol package.
- Ethereum Sepolia USDC smoke test passed with a burner signer acting as `safe`.
- Ethereum Sepolia USDC test token: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`.
- Ethereum Sepolia Safe created: `0x81A397a3654e461A043B1DCf3591689873Be2a8C` (`Test` in Safe UI).
- Ethereum Sepolia module deployed: `0xDA61800A39739E1E32860dB58ecA7764bd5209eB`.
- Ethereum Sepolia Safe deposited 20 USDC into the module.

## Closed For Arbitrum Sepolia

- Hardhat `arbitrumSepolia` network configured.
- Frontend active chain switched to Arbitrum Sepolia.
- Arbitrum Sepolia deploy parameter template exists at `contracts/ignition/parameters.arbitrum-sepolia.example.json`.

## Accounts

Current owner/deployer wallet:

```text
0xA3AEfB2adB03Bcf57033A0C4376361696Ab71517
```

Needed next:

```text
Get an Arbitrum Sepolia Safe address and a real Arbitrum Sepolia ERC-20 token address.
```

## Arbitrum Sepolia Setup

Create/select a Safe on Arbitrum Sepolia:

```text
https://app.safe.global/
Network: Arbitrum Sepolia
Owner: 0xA3AEfB2adB03Bcf57033A0C4376361696Ab71517
```

Get a real Arbitrum Sepolia ERC-20 token and fund the Safe with it. Record:

```text
Token address:
Token symbol:
Token decimals:
Safe address:
```

Create deployment params:

```powershell
Copy-Item .\ignition\parameters.arbitrum-sepolia.example.json .\ignition\parameters.arbitrum-sepolia.json
```

Edit `contracts/ignition/parameters.arbitrum-sepolia.json` with the real token and Safe addresses.

Deploy the module:

```powershell
pnpm hardhat ignition deploy .\ignition\modules\ConfidentialPayoutModule.ts --network arbitrumSepolia --parameters .\ignition\parameters.arbitrum-sepolia.json
```

Record the deployed module in:

```text
contracts/deployments.arbitrum-sepolia.json
```

## Safe Deposit Batch

After module deploy and Safe token funding, generate a Safe Transaction Builder batch:

```powershell
$env:CHAIN_ID="421614"
$env:TOKEN_ADDRESS="0xRealArbitrumSepoliaToken"
$env:TOKEN_SYMBOL="TOKEN"
$env:TOKEN_DECIMALS="6"
$env:SAFE_ADDRESS="0xArbitrumSepoliaSafe"
$env:MODULE_ADDRESS="0xArbitrumSepoliaModule"
$env:DEPOSIT_AMOUNT="20"
pnpm hardhat run .\scripts\prepare-safe-deposit.ts --network arbitrumSepolia
```

Import the printed JSON in Safe Transaction Builder on Arbitrum Sepolia and execute.

Check balances:

```powershell
$env:NETWORK="arbitrumSepolia"
$env:TOKEN_ADDRESS="0xRealArbitrumSepoliaToken"
$env:TOKEN_SYMBOL="TOKEN"
$env:TOKEN_DECIMALS="6"
$env:OWNER_ADDRESS="0xA3AEfB2adB03Bcf57033A0C4376361696Ab71517"
$env:SAFE_ADDRESS="0xArbitrumSepoliaSafe"
$env:MODULE_ADDRESS="0xArbitrumSepoliaModule"
pnpm hardhat run .\scripts\check-token-balances.ts --network arbitrumSepolia
```

## Next: Encrypted Payout

- Encrypt a payout amount with Nox JS tooling on Arbitrum Sepolia.
- Call `requestPayout(recipient, amountHandle, amountProof)` through the Safe.
- Generate public decryption proofs for amount and debit success.
- Call `finalizePayout(requestId, amountDecryptionProof, debitSuccessDecryptionProof)` through the Safe.

## Ethereum Sepolia Archive

Recorded addresses from the earlier Ethereum Sepolia branch:

```text
USDC:   0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
Safe:   0x81A397a3654e461A043B1DCf3591689873Be2a8C
Module: 0xDA61800A39739E1E32860dB58ecA7764bd5209eB
```

## Remaining Deliverables

- Full request/finalize integration test.
- Frontend contract wiring.
- README refresh.
- `feedback.md` for Nox tooling.
- Demo video.
- X post tagging `@iEx_ec`.
