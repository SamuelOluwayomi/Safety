---
sidebar_position: 2
title: Gas Issues
---

# Gas Issues

## Why Nox Operations Need High Gas

iExec Nox TEE operations are not simple storage writes. Each Nox call involves:

1. A call to the `NoxCompute` on-chain verifier contract.
2. An off-chain TEE enclave execution.
3. An on-chain proof verification step.

This makes each Nox operation cost between 30,000 and 80,000 gas, and complex functions that chain multiple Nox calls together can easily exceed 300,000 gas.

## Gas Limits Set by Safety

| Transaction | Gas Limit | Nox Ops |
|---|---|---|
| `execTransaction → deposit` (first) | 250,000 | `toEuint256(0)` + `allowThis` + `allow` + `toEuint256(amount)` + `add` + `allowThis` + `allow` |
| `execTransaction → deposit` (subsequent) | 250,000 | `toEuint256(amount)` + `add` + `allowThis` + `allow` |
| `execTransaction → requestPayout` | 600,000 | `fromExternal` + `safeSub` + `select` + 5× `allow` / `allowThis` + 2× `allowPublicDecryption` |
| `execTransaction → finalizePayout` | 600,000 | 2× `publicDecrypt` |
| `approveHash` | 150,000 | None (simple storage write) |

## Out-of-Gas Errors

If a transaction reverts due to gas exhaustion:

1. It will appear as a failed transaction on the block explorer with status `Reverted`.
2. The error in the frontend will be `"execTransaction reverted on-chain"` or `"finalizePayout reverted on-chain"`.
3. No funds are lost — the state changes are rolled back.

Retry the transaction. Gas costs can vary depending on network congestion and the Nox TEE enclave execution time.

## Checking Gas Usage

On Etherscan or Arbiscan, open any Safety transaction and look at **Gas Used**. If it is at or near the gas limit, that is a sign of gas exhaustion.

For `requestPayout`, expect Gas Used to be 350,000–550,000. For `finalizePayout`, expect 200,000–400,000.

## Gas Estimation Note

Wagmi and viem's automatic gas estimation may underestimate Nox transactions because the estimation runs the transaction in a non-TEE simulation environment where Nox costs are different from production. Always set gas limits manually for Nox-heavy calls, as Safety already does.
