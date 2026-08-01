---
sidebar_position: 3
title: Deposit
---

# Deposit USDC

Depositing moves USDC from the Safe wallet into the `ConfidentialPayoutModule`, where the balance is encrypted and tracked by the Nox TEE.

## Prerequisites

- The Safe must hold USDC on the selected network.
- The `ConfidentialPayoutModule` must be enabled on the Safe (see [Create a Safe](/guides/create-safe)).

## Steps

1. Open the dashboard with your Safe loaded.
2. Click **Deposit**.
3. Enter the USDC amount (human-readable, e.g. `28`).
4. Confirm — two Safe transactions will execute back-to-back:

### Transaction 1: ERC-20 Approve

The Safe calls `USDC.approve(moduleAddress, amount)` to allow the module to pull tokens.

```
Safe → execTransaction → USDC.approve(module, amount)
```

### Transaction 2: Deposit

The Safe calls `module.deposit(amount)` which transfers the tokens in and updates the encrypted balance.

```
Safe → execTransaction → module.deposit(amount)
         → USDC.transferFrom(safe, module, amount)
         → [first deposit only] Nox.toEuint256(0) — lazy init
         → Nox.toEuint256(amount)
         → Nox.add(encryptedBalance, encAmount)
```

## First Deposit Behavior

The first ever `deposit` call on a module instance triggers **lazy initialization**:

```solidity
if (!encryptedBalanceSeeded) {
    encryptedBalance = Nox.toEuint256(0);
    Nox.allowThis(encryptedBalance);
    Nox.allow(encryptedBalance, safe);
    encryptedBalanceSeeded = true;
}
```

This seeds the encrypted balance to zero before adding the deposited amount. This call cannot happen in the constructor (see [Nox Constructor Restriction](/protocols/iexec-nox#constructor-restriction)).

## Gas Estimates

| Transaction | Estimated Gas |
|---|---|
| ERC-20 `approve` | ~50,000 |
| `deposit` (first time) | ~200,000 |
| `deposit` (subsequent) | ~150,000 |

Safety sets `execTransaction` gas to 250,000 for deposit calls.

## Viewing the Balance

The dashboard USDC balance card shows the Safe wallet's USDC balance (not the encrypted module balance). The encrypted module balance is not readable by the frontend — only the Nox TEE can decrypt it for authorized addresses.
