import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

const SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const DEPOSIT_AMOUNT = 1_000_000n; // 1.00 USDC, 6 decimals

describe("ConfidentialPayoutModule (Sepolia USDC)", function () {
  it("accepts a real USDC deposit from the configured Safe signer", async function () {
    const { viem } = await network.connect("sepolia");
    const publicClient = await viem.getPublicClient();
    const [safeSigner] = await viem.getWalletClients();

    assert.ok(
      safeSigner?.account?.address,
      "Set SEPOLIA_PRIVATE_KEY in .env before running the Sepolia test",
    );

    const usdc = await viem.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      SEPOLIA_USDC,
      {
        client: { wallet: safeSigner },
      },
    );
    const initialBalance = (await usdc.read.balanceOf([
      safeSigner.account.address,
    ])) as bigint;
    assert.ok(
      initialBalance >= DEPOSIT_AMOUNT,
      `Safe signer needs at least ${DEPOSIT_AMOUNT} raw USDC units`,
    );

    const payoutModule = await viem.deployContract("ConfidentialPayoutModule", [
      SEPOLIA_USDC,
      safeSigner.account.address,
    ]);

    const approveHash = await usdc.write.approve([payoutModule.address, DEPOSIT_AMOUNT]);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });

    const depositHash = await payoutModule.write.deposit([DEPOSIT_AMOUNT], {
      account: safeSigner.account,
    });
    await publicClient.waitForTransactionReceipt({ hash: depositHash });

    const moduleBalance = (await usdc.read.balanceOf([
      payoutModule.address,
    ])) as bigint;
    assert.equal(moduleBalance, DEPOSIT_AMOUNT);
  });
});
