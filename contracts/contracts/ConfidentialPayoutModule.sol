// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Nox, ebool, euint256, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

contract ConfidentialPayoutModule {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;   // standard ERC-20 token address (e.g. USDC)
    address public immutable safe;   // Gnosis Safe address

    euint256 private encryptedBalance;

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

    constructor(IERC20 token_, address safe_) {
        token = token_;
        safe = safe_;
        encryptedBalance = Nox.toEuint256(0);
        Nox.allowThis(encryptedBalance);
        Nox.allow(encryptedBalance, safe_);
    }

    /// @notice Safe deposits real tokens; internal accounting balance becomes encrypted.
    function deposit(uint256 amount) external onlySafe {
        token.safeTransferFrom(msg.sender, address(this), amount);
        euint256 encAmount = Nox.toEuint256(amount);
        encryptedBalance = Nox.add(encryptedBalance, encAmount);
        Nox.allowThis(encryptedBalance);
        Nox.allow(encryptedBalance, safe);

        emit Deposited(msg.sender, amount);
    }

    /// @notice Called by the Safe, after normal multisig approval, to request a
    /// confidential payout. Amount is encrypted client-side (JS SDK) before this call.
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
        Nox.allow(amount, recipient); // recipient can decrypt what they're owed
        Nox.allow(debitSuccess, safe);
        Nox.allowPublicDecryption(amount);
        Nox.allowPublicDecryption(debitSuccess);

        emit PayoutRequested(requestId, recipient);
    }

    /// @notice Safe grants an auditor/other signer view access to a specific payout.
    function grantAuditorAccess(uint256 requestId, address auditor) external onlySafe {
        require(auditor != address(0), "zero auditor");
        Nox.allow(pendingPayouts[requestId].amount, auditor);
    }

    /// @notice Finalizes a payout request and transfers the tokens to the recipient.
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
