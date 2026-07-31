// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ConfidentialPayoutModule} from "./ConfidentialPayoutModule.sol";

contract ConfidentialPayoutFactory {
    address public immutable implementation;
    IERC20 public immutable defaultToken;

    mapping(address => address) public safeToModule;

    event ModuleCreated(address indexed safe, address module);

    constructor(address implementation_, IERC20 defaultToken_) {
        require(implementation_ != address(0), "zero implementation");
        require(address(defaultToken_) != address(0), "zero token");
        implementation = implementation_;
        defaultToken = defaultToken_;
    }

    function getOrCreateModule(address safeAddress) external returns (address moduleAddress) {
        require(safeAddress != address(0), "zero safe");
        if (safeToModule[safeAddress] != address(0)) {
            return safeToModule[safeAddress];
        }

        moduleAddress = Clones.clone(implementation);
        ConfidentialPayoutModule(moduleAddress).initialize(defaultToken, safeAddress);
        safeToModule[safeAddress] = moduleAddress;

        emit ModuleCreated(safeAddress, moduleAddress);
    }

    function getModule(address safeAddress) external view returns (address) {
        return safeToModule[safeAddress];
    }
}
