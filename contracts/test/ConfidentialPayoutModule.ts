import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { erc20Abi } from "viem";

const SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const DEPOSIT_AMOUNT = 1_000_000n; // 1.00 USDC

describe("ConfidentialPayoutModule (Sepolia USDC smoke test)", function () {
  it("accepts a real USDC deposit from a burner signer acting as the Safe", async function () {
    const { viem } = await network.connect("sepolia");
    const publicClient = await viem.getPublicClient();
    const [safeSigner] = await viem.getWalletClients();

    assert.ok(
      safeSigner?.account?.address,
      "Set SEPOLIA_PRIVATE_KEY in .env before running the Sepolia smoke test",
    );

    const initialBalance = (await publicClient.readContract({
      address: SEPOLIA_USDC,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [safeSigner.account.address],
    } as any)) as bigint;

    assert.ok(
      initialBalance >= DEPOSIT_AMOUNT,
      `Safe signer needs at least ${DEPOSIT_AMOUNT} raw USDC units`,
    );

    const payoutModule = await viem.deployContract("ConfidentialPayoutModule", [
      SEPOLIA_USDC,
      safeSigner.account.address,
    ]);

    const approveHash = await safeSigner.writeContract({
      address: SEPOLIA_USDC,
      abi: erc20Abi,
      functionName: "approve",
      args: [payoutModule.address, DEPOSIT_AMOUNT],
    } as any);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });

    const depositHash = await safeSigner.writeContract({
      address: payoutModule.address,
      abi: payoutModule.abi,
      functionName: "deposit",
      args: [DEPOSIT_AMOUNT],
    } as any);
    await publicClient.waitForTransactionReceipt({ hash: depositHash });

    const moduleBalance = (await publicClient.readContract({
      address: SEPOLIA_USDC,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [payoutModule.address],
    } as any)) as bigint;
    assert.equal(moduleBalance, DEPOSIT_AMOUNT);
  });
});
