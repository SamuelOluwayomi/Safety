---
sidebar_position: 1
title: ConfidentialPayoutModule
---

# ConfidentialPayoutModule.sol

The `ConfidentialPayoutModule` is the core smart contract that manages encrypted treasury accounting. One instance is deployed per Gnosis Safe address.

## Full Source Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Nox, ebool, euint256, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

contract ConfidentialPayoutModule {
    using SafeERC20 for IERC20;

    IERC20 public token;   // standard ERC-20 token address (e.g. USDC)
    address public safe;   // Gnosis Safe address
    bool private initialized;

    euint256 private encryptedBalance;
    bool private encryptedBalanceSeeded;

    struct PendingPayout {
        address recipient;
        euint256 amount;
        ebool debitSuccess;
        bool finalized;
    }
    uint256 public nextRequestId;
    mapping(uint256 => PendingPayout) public pendingPayouts;

    event Deposited(address indexed from, uint256 amount);
    event PayoutRequested(uint256 indexed requestId, address indexed recipient);
    event PayoutFinalized(uint256 indexed requestId, address indexed recipient, uint256 amount);

    modifier onlySafe() {
        require(msg.sender == safe, "not safe");
        _;
    }

    constructor() {}

    function initialize(IERC20 token_, address safe_) external {
        require(!initialized, "already initialized");
        require(address(token_) != address(0), "zero token");
        require(safe_ != address(0), "zero safe");
        initialized = true;
        token = token_;
        safe = safe_;
    }

    function deposit(uint256 amount) external onlySafe {
        if (!encryptedBalanceSeeded) {
            encryptedBalance = Nox.toEuint256(0);
            Nox.allowThis(encryptedBalance);
            Nox.allow(encryptedBalance, safe);
            encryptedBalanceSeeded = true;
        }

        token.safeTransferFrom(msg.sender, address(this), amount);
        euint256 encAmount = Nox.toEuint256(amount);
        encryptedBalance = Nox.add(encryptedBalance, encAmount);
        Nox.allowThis(encryptedBalance);
        Nox.allow(encryptedBalance, safe);

        emit Deposited(msg.sender, amount);
    }

    function requestPayout(
        address recipient,
        externalEuint256 amountHandle,
        bytes calldata amountProof
    ) external onlySafe returns (uint256 requestId) {
        require(recipient != address(0), "zero recipient");

        euint256 amount = Nox.fromExternal(amountHandle, amountProof);
        (ebool debitSuccess, euint256 newEncryptedBalance) = Nox.safeSub(encryptedBalance, amount);
        encryptedBalance = Nox.select(debitSuccess, newEncryptedBalance, encryptedBalance);
        Nox.allowThis(encryptedBalance);
        Nox.allow(encryptedBalance, safe);

        requestId = nextRequestId++;
        pendingPayouts[requestId] = PendingPayout(recipient, amount, debitSuccess, false);
        Nox.allowThis(amount);
        Nox.allowThis(debitSuccess);
        Nox.allow(amount, recipient);
        Nox.allow(debitSuccess, safe);
        Nox.allowPublicDecryption(amount);
        Nox.allowPublicDecryption(debitSuccess);

        emit PayoutRequested(requestId, recipient);
    }

    function grantAuditorAccess(uint256 requestId, address auditor) external onlySafe {
        require(auditor != address(0), "zero auditor");
        Nox.allow(pendingPayouts[requestId].amount, auditor);
    }

    function finalizePayout(
        uint256 requestId,
        bytes calldata amountDecryptionProof,
        bytes calldata debitSuccessDecryptionProof
    ) external onlySafe {
        PendingPayout storage payout = pendingPayouts[requestId];
        require(payout.recipient != address(0), "unknown request");
        require(!payout.finalized, "already finalized");

        bool debitSucceeded = Nox.publicDecrypt(payout.debitSuccess, debitSuccessDecryptionProof);
        require(debitSucceeded, "insufficient encrypted balance");

        uint256 amountPlaintext = Nox.publicDecrypt(payout.amount, amountDecryptionProof);
        payout.finalized = true;

        token.safeTransfer(payout.recipient, amountPlaintext);
        emit PayoutFinalized(requestId, payout.recipient, amountPlaintext);
    }
}
```

## State Variables

| Variable | Type | Visibility | Description |
|---|---|---|---|
| `token` | `IERC20` | public | ERC-20 token held by the treasury (USDC) |
| `safe` | `address` | public | The Gnosis Safe address that owns this module |
| `initialized` | `bool` | private | One-time init guard |
| `encryptedBalance` | `euint256` | private | Running encrypted USDC balance |
| `encryptedBalanceSeeded` | `bool` | private | Lazy-init guard for first deposit |
| `nextRequestId` | `uint256` | public | Auto-incrementing payout request counter |
| `pendingPayouts` | `mapping` | public | Maps request ID to `PendingPayout` struct |

## Functions

### `constructor()`

Empty constructor. Performs no Nox TEE operations to ensure deployment always succeeds.

### `initialize(IERC20 token_, address safe_)`

One-shot initializer called immediately after deployment by the server. Sets `token` and `safe`. Reverts if called more than once.

### `deposit(uint256 amount)`

**Access:** `onlySafe` only.

Transfers `amount` tokens from the Safe into the module and adds them to the encrypted balance. On the first call, lazily seeds `encryptedBalance = Nox.toEuint256(0)`.

**Lazy init sequence on first deposit:**
1. `Nox.toEuint256(0)` — creates encrypted zero
2. `Nox.allowThis(encryptedBalance)` — grant module decrypt access
3. `Nox.allow(encryptedBalance, safe)` — grant Safe decrypt access
4. Set `encryptedBalanceSeeded = true`

### `requestPayout(address recipient, externalEuint256 amountHandle, bytes amountProof)`

**Access:** `onlySafe` only.

The core payout proposal function. Accepts a client-generated encrypted handle and TEE proof. Performs encrypted balance deduction and queues the payout.

**Execution steps:**
1. `Nox.fromExternal(handle, proof)` — validates and imports the client-encrypted amount
2. `Nox.safeSub(encryptedBalance, amount)` — returns `(ebool debitSuccess, euint256 newBalance)`
3. `Nox.select(debitSuccess, newBalance, encryptedBalance)` — conditionally update balance
4. Store `PendingPayout{recipient, amount, debitSuccess, false}`
5. Set ACL permissions for module, recipient, Safe, and public decryption
6. Emit `PayoutRequested(requestId, recipient)`

### `grantAuditorAccess(uint256 requestId, address auditor)`

**Access:** `onlySafe` only.

Allows a specified auditor address to generate decryption proofs for a payout's amount handle via the Nox TEE.

### `finalizePayout(uint256 requestId, bytes amountDecryptionProof, bytes debitSuccessDecryptionProof)`

**Access:** `onlySafe` only.

Settles a pending payout by verifying TEE-generated public decryption proofs.

**Execution steps:**
1. `Nox.publicDecrypt(debitSuccess, debitProof)` — verify debit succeeded
2. Revert with `"insufficient encrypted balance"` if debit failed
3. `Nox.publicDecrypt(amount, amountProof)` — reveal plaintext amount
4. Mark payout as `finalized = true`
5. `IERC20.safeTransfer(recipient, amountPlaintext)` — transfer tokens
6. Emit `PayoutFinalized(requestId, recipient, amount)`

## Events

| Event | Parameters | Description |
|---|---|---|
| `Deposited` | `address from, uint256 amount` | Emitted when USDC deposited |
| `PayoutRequested` | `uint256 requestId, address recipient` | Emitted when payout proposed |
| `PayoutFinalized` | `uint256 requestId, address recipient, uint256 amount` | Emitted on settlement |

## Security Properties

- All state-changing functions require `msg.sender == safe`. The module deployer has no privileged access after deployment and initialization.
- `initialize` is callable exactly once.
- `finalizePayout` checks `!payout.finalized` before executing, preventing double-spending.
- `finalizePayout` verifies `debitSucceeded == true` before transferring, preventing invalid payouts when the balance was insufficient.
- `Nox.safeSub` combined with `Nox.select` ensures the encrypted balance only decreases if the debit is valid.
