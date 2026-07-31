# Safety Deployment Checklist

## Active Target

Arbitrum Sepolia is the current active demo target, and Ethereum Sepolia is also supported by Nox. The frontend can switch between them with `NEXT_PUBLIC_CHAIN_ID`.

```text
Network: Arbitrum Sepolia
Chain ID: 421614
Safe prefix: arbsep
Explorer: https://sepolia.arbiscan.io
```

No mock token should be used. Use real public testnet ERC-20 tokens on the selected network.

## Closed On Ethereum Sepolia

These prove the Safe/module/deposit plumbing on Ethereum Sepolia. They can be used as a secondary deployment path.

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
- Real Arbitrum Sepolia 1/1 Safe deployed: `0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0`.
- Real Arbitrum Sepolia USDC selected: `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` (`USDC`, 6 decimals).
- Arbitrum Sepolia deployment parameters exist at `contracts/ignition/parameters.arbitrum-sepolia.json`.
- Arbitrum Sepolia module deployed: `0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4`.
- Arbitrum Sepolia deployment addresses recorded at `contracts/deployments.arbitrum-sepolia.json`.
- Arbitrum Sepolia Safe deposit transaction sent: `0x6950f0a7ce52e5a3679af628898c347b9a0f6e73bb7f20f86496bd5e7da65db9`.
- Arbitrum Sepolia Safe deposited 20 USDC into the module.

## Accounts

Current owner/deployer wallet:

```text
0xA3AEfB2adB03Bcf57033A0C4376361696Ab71517
```

Needed next:

```text
Build and execute the encrypted payout request flow.
```

## Arbitrum Sepolia Setup

Safe Wallet UI does not currently expose Arbitrum Sepolia. Deploy a real Safe contract with Protocol Kit instead:

```powershell
cd ..\frontend
$env:OWNER_ADDRESS="0xA3AEfB2adB03Bcf57033A0C4376361696Ab71517"
$env:ARBITRUM_SEPOLIA_PRIVATE_KEY="0xYourPrivateKey"
$env:ARBITRUM_SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
node .\scripts\deploy-safe-arbitrum-sepolia.mjs
```

This creates a real 1/1 Safe on Arbitrum Sepolia. Because there is no Safe Transaction Service for this network, do not rely on Safe UI queues or API Kit proposal coordination. For the hackathon demo, threshold 1 lets scripts execute Safe transactions directly while still using the real Safe contract.

Get a real Arbitrum Sepolia ERC-20 token and fund the Safe with it. Record:

```text
Token address: 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d
Token symbol: USDC
Token decimals: 6
Safe address: 0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0
```

Deploy the module:

```powershell
pnpm hardhat ignition deploy .\ignition\modules\ConfidentialPayoutModule.ts --network arbitrumSepolia --parameters .\ignition\parameters.arbitrum-sepolia.json
```

Record the deployed module in:

```text
contracts/deployments.arbitrum-sepolia.json
```

Current Arbitrum Sepolia addresses:

```text
USDC:   0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d
Safe:   0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0
Module: 0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4
```

## Safe Deposit

After module deploy and Safe token funding, execute `approve` + `deposit` directly through the 1/1 Safe:

```powershell
cd ..\frontend
$env:ARBITRUM_SEPOLIA_PRIVATE_KEY="0xYourPrivateKey"
$env:ARBITRUM_SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
$env:TOKEN_ADDRESS="0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
$env:TOKEN_SYMBOL="USDC"
$env:TOKEN_DECIMALS="6"
$env:SAFE_ADDRESS="0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0"
$env:MODULE_ADDRESS="0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4"
$env:DEPOSIT_AMOUNT="20"
node .\scripts\execute-safe-deposit-arbitrum-sepolia.mjs
```

If you only want to generate calldata JSON for inspection, use the contracts helper:

```powershell
cd ..\contracts
$env:CHAIN_ID="421614"
$env:TOKEN_ADDRESS="0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
$env:TOKEN_SYMBOL="USDC"
$env:TOKEN_DECIMALS="6"
$env:SAFE_ADDRESS="0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0"
$env:MODULE_ADDRESS="0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4"
$env:DEPOSIT_AMOUNT="20"
pnpm hardhat run .\scripts\prepare-safe-deposit.ts --network arbitrumSepolia
```

Check balances:

```powershell
$env:NETWORK="arbitrumSepolia"
$env:TOKEN_ADDRESS="0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
$env:TOKEN_SYMBOL="USDC"
$env:TOKEN_DECIMALS="6"
$env:OWNER_ADDRESS="0xA3AEfB2adB03Bcf57033A0C4376361696Ab71517"
$env:SAFE_ADDRESS="0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0"
$env:MODULE_ADDRESS="0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4"
pnpm hardhat run .\scripts\check-token-balances.ts --network arbitrumSepolia
```

Verified Arbitrum Sepolia USDC state:

```text
Owner:  40 USDC
Safe:   0 USDC
Module: 20 USDC
```

## Next: Encrypted Payout

### Step 1: Encrypt and Prepare Payout Request

Run from `contracts`:

```powershell
cd C:\Users\SAMUEL\Desktop\SAMUEL\Hackathon\safety\contracts
$env:NETWORK="arbitrumSepolia"
$env:TOKEN_ADDRESS="0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
$env:SAFE_ADDRESS="0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0"
$env:MODULE_ADDRESS="0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4"
$env:RECIPIENT_ADDRESS="0xA3AEfB2adB03Bcf57033A0C4376361696Ab71517"
$env:PAYOUT_AMOUNT="5"

pnpm hardhat run .\scripts\prepare-safe-request-payout.ts --network arbitrumSepolia
```

Copy the generated `Raw Calldata for Safe Transaction` output string (`0x...`).

### Step 2: Execute Payout Request via Safe

Run from `frontend`:

```powershell
cd C:\Users\SAMUEL\Desktop\SAMUEL\Hackathon\safety\frontend
$env:SAFE_ADDRESS="0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0"
$env:MODULE_ADDRESS="0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4"
$env:TX_DATA="0xPASTE_CALLDATA_FROM_STEP_1_HERE"

node .\scripts\execute-safe-tx-arbitrum-sepolia.mjs
```

### Step 3: Generate Public Decryption Proofs and Prepare Finalize

Run from `contracts` (using `REQUEST_ID="0"` for the first payout):

```powershell
cd C:\Users\SAMUEL\Desktop\SAMUEL\Hackathon\safety\contracts
$env:NETWORK="arbitrumSepolia"
$env:SAFE_ADDRESS="0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0"
$env:MODULE_ADDRESS="0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4"
$env:REQUEST_ID="0"

pnpm hardhat run .\scripts\prepare-safe-finalize-payout.ts --network arbitrumSepolia
```

Copy the generated `Raw Calldata for Safe Transaction` output string (`0x...`).

### Step 4: Execute Finalize Payout via Safe

Run from `frontend`:

```powershell
cd C:\Users\SAMUEL\Desktop\SAMUEL\Hackathon\safety\frontend
$env:SAFE_ADDRESS="0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0"
$env:MODULE_ADDRESS="0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4"
$env:TX_DATA="0xPASTE_CALLDATA_FROM_STEP_3_HERE"

node .\scripts\execute-safe-tx-arbitrum-sepolia.mjs
```

### Step 5: Verify Final Balances

Run from `contracts`:

```powershell
cd C:\Users\SAMUEL\Desktop\SAMUEL\Hackathon\safety\contracts
$env:NETWORK="arbitrumSepolia"
$env:TOKEN_ADDRESS="0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
$env:TOKEN_SYMBOL="USDC"
$env:TOKEN_DECIMALS="6"
$env:OWNER_ADDRESS="0xA3AEfB2adB03Bcf57033A0C4376361696Ab71517"
$env:SAFE_ADDRESS="0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0"
$env:MODULE_ADDRESS="0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4"

pnpm hardhat run .\scripts\check-token-balances.ts --network arbitrumSepolia
```

## Ethereum Sepolia Archive

Recorded addresses from the earlier Ethereum Sepolia branch:

```text
USDC:   0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
Safe:   0x81A397a3654e461A043B1DCf3591689873Be2a8C
Module: 0xDA61800A39739E1E32860dB58ecA7764bd5209eB
```

To point the frontend at Ethereum Sepolia:

```text
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_TOKEN_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
NEXT_PUBLIC_CONFIDENTIAL_PAYOUT_MODULE_ADDRESS=0xDA61800A39739E1E32860dB58ecA7764bd5209eB
NEXT_PUBLIC_SAFE_ADDRESS=0x81A397a3654e461A043B1DCf3591689873Be2a8C
```

## Remaining Deliverables

- Full request/finalize integration test.
- Frontend contract wiring.
- README refresh.
- `feedback.md` for Nox tooling.
- Demo video.
- X post tagging `@iEx_ec`.
