# iExec Nox Protocol Developer Feedback and Review

Project: Safety Confidential Treasury Layer for Gnosis Safe
Hackathon: iExec WTF Hackathon Summer Edition
Author: Oluwayomi Samuel

Overview

Building Safety on top of iExec Nox and Gnosis Safe provided a practical integration process. Nox enabled confidential payroll and private treasury payout capabilities for standard Gnosis Safe smart accounts without requiring users to switch wallets or altering Safe proxy smart contract interfaces.

Below is the technical feedback covering positive implementation aspects developer experience observations and recommendations for the iExec tool suite.

Positive Technical Implementation Aspects

1. Wallet Compatibility and Composability
Nox functions as an application layer overlay. Users do not need custom privacy wallets or specialized cryptography libraries in their browser. Standard Web3 wallets sign standard EVM transactions while Nox handles TEE encryption off chain.

2. Solidity Contract Types
The nox protocol contracts Solidity library is intuitive. Functions such as Nox.fromExternal, Nox.safeSub, Nox.select and Nox.allowPublicDecryption allowed implementation of encrypted arithmetic logic directly in standard Solidity 0.8.35 without custom cryptographic boilerplate.

3. Client Side SDK
The JS TS SDK simplified client side handle encryption via encryptInput and public decryption proof retrieval via publicDecrypt inside Next.js API routes.

My Observations and Recommendations

1. Enclave Execution Behavior During Contract Deployment
Observation: Invoking Nox.toEuint256(0) inside the Solidity constructor or proxy deployment transaction caused on chain deployment reverts on testnets.
Root Cause: During contract creation inside the constructor the contract bytecode is not yet committed to state storage. This means contract codesize is zero when queried. The Nox TEE enclave rejects execution checks when codesize is zero.
Applied Resolution: ConfidentialPayoutModule.sol was structured to perform zero Nox enclave calls during constructor or initialize execution. Instead encryptedBalance is lazily seeded on the first deposit execution after the contract bytecode is committed to the blockchain.
Recommendation: Update Nox getting started documentation to document this lazy initialization pattern for contract constructors.

2. Gas Limit Requirements for TEE Operations
Observation: Transactions combining multiple Nox operations such as requestPayout using fromExternal safeSub select allowThis and allowPublicDecryption require between 300000 and 500000 gas.
Root Cause: Default wallet gas estimation algorithms occasionally underbudget gas limits for complex TEE module executions resulting in out of gas reverts.
Applied Resolution: Gas execution limits were set to 600000 gas for module transaction executions.
Recommendation: Provide recommended gas limit parameters in Nox SDK documentation for multi operation TEE transactions.

3. Hardhat 3 and Viem Integration
Observation: Importing nox hardhat plugin alongside Hardhat 3 ESM packages required manual module export alignment.
Recommendation: Provide starter templates containing standard Hardhat 3 ESM and Viem configurations.

4. Network Documentation Consistency
Observation: The Nox Confidential Token demo app's Terms of Use (cdefi.iex.ec/terms) state the app "operates exclusively" on a single testnet — but this claim does not match the officially documented network support. The official Nox documentation (docs.noxprotocol.io/getting-started/networks) lists both Ethereum Sepolia and Arbitrum Sepolia as fully supported, each with its own NoxCompute contract address, RPC endpoint, and faucets.
Impact: This inconsistency cost meaningful development time reconciling which network was actually correct and appropriate for a hackathon submission requiring Ethereum Sepolia specifically.
Recommendation: Align the demo app's Terms of Use with the current state of the protocol documentation, or clarify explicitly that the "exclusively" language refers only to that specific demo app's scope, not the Nox protocol's actual network support.

Conclusion

iExec Nox provides a functional confidential computing architecture for Web3 application development. Maintaining DeFi composability while supplying hardware enclave privacy is applicable for treasury management and automated disbursements.
