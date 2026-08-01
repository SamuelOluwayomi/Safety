---
sidebar_position: 3
title: Error Codes
---

# Error Codes

## Smart Contract Revert Strings

### ConfidentialPayoutModule

| Revert String | Function | Cause |
|---|---|---|
| `"not safe"` | All state-changing functions | `msg.sender != safe` — call was not made through the Safe |
| `"already initialized"` | `initialize` | `initialize()` called more than once |
| `"zero token"` | `initialize` | `token_` is the zero address |
| `"zero safe"` | `initialize` | `safe_` is the zero address |
| `"zero recipient"` | `requestPayout` | `recipient` is the zero address |
| `"unknown request"` | `finalizePayout`, `grantAuditorAccess` | `requestId` does not exist (recipient is zero address) |
| `"already finalized"` | `finalizePayout` | This `requestId` has already been settled |
| `"insufficient encrypted balance"` | `finalizePayout` | `debitSuccess` decrypted to `false` — balance was too low at request time |
| `"zero auditor"` | `grantAuditorAccess` | `auditor` is the zero address |

### Gnosis Safe

| Error Code | Cause |
|---|---|
| `GS026` | Signature threshold not met |
| `GS104` | Target module is not enabled on this Safe |
| `GS013` | Safe transaction failed (inner call reverted) |
| `GS000` | Could not pay gas costs |

## Frontend Error Messages

| Error Message | Hook | Cause |
|---|---|---|
| `"execTransaction reverted on-chain"` | `useProposePayout` | `requestPayout` transaction failed |
| `"finalizePayout reverted on-chain"` | `useFinalizePayout` | `finalizePayout` transaction failed |
| `"approveHash failed"` | Both | `approveHash` transaction failed |
| `"Missing required fields: amount, owner, appContract"` | API `/api/nox/encrypt` | One of the required fields was not sent |
| `"Private key not set for chain ..."` | API `/api/nox/encrypt` | Server-side env var for the requested chain is missing |
| `"No DEPLOYER_PRIVATE_KEY found in .env"` | Deploy scripts | Contracts `.env` is missing the deployer key |

## HTTP Status Codes from API Routes

| Status | Meaning |
|---|---|
| `200` | Success |
| `400` | Bad request — missing or invalid body fields |
| `500` | Server error — check Next.js server logs for details |
