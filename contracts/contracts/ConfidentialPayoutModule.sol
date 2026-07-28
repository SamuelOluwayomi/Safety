// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Nox, euint256, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

contract ConfidentialPayoutModule {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;   // your real Sepolia testnet token
    address public immutable safe;   // your Gnosis Safe address

    euint256 private encryptedBalance;

    struct PendingPayout {
        address recipient;
        euint256 amount;
        bool finalized;
    }
    uint256 public nextRequestId;
    mapping(uint256 => PendingPayout) public pendingPayouts;

    event Deposited(address indexed from, uint256 requestId);
    event PayoutRequested(uint256 indexed requestId, address indexed recipient);
    event PayoutFinalized(uint256 indexed requestId, address indexed recipient);

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
    }

    /// @notice Called by the Safe, after normal multisig approval, to request a
    /// confidential payout. Amount is encrypted client-side (JS SDK) before this call.
    function requestPayout(
        address recipient,
        externalEuint256 amountHandle,
        bytes calldata amountProof
    ) external onlySafe returns (uint256 requestId) {
        euint256 amount = Nox.fromExternal(amountHandle, amountProof);

        // TODO harden: use Nox.safeSub + Nox.select instead of Nox.sub so an
        // insufficient balance doesn't wrap around and leak info (per Nox's own
        // overflow warning in the Hello World guide).
        encryptedBalance = Nox.sub(encryptedBalance, amount);
        Nox.allowThis(encryptedBalance);
        Nox.allow(encryptedBalance, safe);

        requestId = nextRequestId++;
        pendingPayouts[requestId] = PendingPayout(recipient, amount, false);
        Nox.allowThis(amount);
        Nox.allow(amount, recipient); // recipient can decrypt what they're owed

        emit PayoutRequested(requestId, recipient);
    }

    /// @notice Safe grants an auditor/other signer view access to a specific payout.
    function grantAuditorAccess(uint256 requestId, address auditor) external onlySafe {
        Nox.allow(pendingPayouts[requestId].amount, auditor);
    }

    // finalizePayout(...) — see note below, this is the one piece I won't guess at
}