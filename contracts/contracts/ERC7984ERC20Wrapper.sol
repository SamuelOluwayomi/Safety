// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Nox, euint256, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

contract ERC7984ERC20Wrapper {
    using SafeERC20 for IERC20;

    IERC20 public immutable underlyingToken;
    string public name;
    string public symbol;

    mapping(address => euint256) private encryptedBalances;

    event Wrapped(address indexed account, uint256 amount);
    event Unwrapped(address indexed account, uint256 amount);

    constructor(IERC20 underlyingToken_, string memory name_, string memory symbol_) {
        underlyingToken = underlyingToken_;
        name = name_;
        symbol = symbol_;
    }

    /// @notice Returns the encrypted balance handle for an account.
    function balanceOf(address account) external view returns (euint256) {
        return encryptedBalances[account];
    }

    /// @notice Wraps standard ERC20 tokens into encrypted balance handles.
    function wrap(uint256 amount) external returns (euint256) {
        underlyingToken.safeTransferFrom(msg.sender, address(this), amount);

        euint256 encAmount = Nox.toEuint256(amount);
        euint256 currentBal = encryptedBalances[msg.sender];

        euint256 newBal = Nox.add(currentBal, encAmount);
        Nox.allowThis(newBal);
        Nox.allow(newBal, msg.sender);

        encryptedBalances[msg.sender] = newBal;
        emit Wrapped(msg.sender, amount);
        return newBal;
    }

    /// @notice Unwraps confidential tokens back to standard ERC20 tokens.
    function unwrap(uint256 amount) external {
        euint256 encAmount = Nox.toEuint256(amount);
        euint256 currentBal = encryptedBalances[msg.sender];

        euint256 newBal = Nox.sub(currentBal, encAmount);
        Nox.allowThis(newBal);
        Nox.allow(newBal, msg.sender);

        encryptedBalances[msg.sender] = newBal;
        underlyingToken.safeTransfer(msg.sender, amount);

        emit Unwrapped(msg.sender, amount);
    }
}
