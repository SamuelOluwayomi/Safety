import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, arbitrumSepolia } from "viem/chains";
import { readFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const targetSafe = process.env.SAFE_ADDRESS ?? process.argv[2];
  if (!targetSafe) {
    throw new Error("Please specify target Safe address: npx ts-node scripts/deploy-module-for-safe.ts <SAFE_ADDRESS>");
  }

  const network = process.env.HARDHAT_NETWORK ?? "sepolia";
  console.log(`[DeployModule] Deploying standalone ConfidentialPayoutModule for Safe: ${targetSafe} on network: ${network}`);

  const chain = network === "arbitrumSepolia" ? arbitrumSepolia : sepolia;
  const rpcUrl = network === "arbitrumSepolia"
    ? (process.env.ARBITRUM_SEPOLIA_RPC_URL ?? "https://sepolia-rollup.arbitrum.io/rpc")
    : (process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com");

  const rawPk = process.env.DEPLOYER_PRIVATE_KEY ?? process.env.SEPOLIA_PRIVATE_KEY;
  if (!rawPk) throw new Error("No DEPLOYER_PRIVATE_KEY found in .env");

  const pk = (rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`) as `0x${string}`;
  const account = privateKeyToAccount(pk);

  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });

  console.log(`Deployer address: ${account.address}`);

  const deployFile = resolve(process.cwd(), `deployments.${network === "arbitrumSepolia" ? "arbitrum-sepolia" : "sepolia"}.json`);
  const deployData = JSON.parse(readFileSync(deployFile, "utf8"));

  console.log(`USDC token address: ${deployData.usdc}`);

  const moduleArtifact = JSON.parse(
    readFileSync(resolve(process.cwd(), "artifacts/contracts/ConfidentialPayoutModule.sol/ConfidentialPayoutModule.json"), "utf8")
  );

  const hash = await (walletClient.deployContract as any)({
    abi: moduleArtifact.abi,
    bytecode: moduleArtifact.bytecode as `0x${string}`,
    args: [deployData.usdc, targetSafe],
    chain,
    account,
  });

  console.log(`Deploying module tx hash: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const moduleAddress = receipt.contractAddress;
  console.log(`\n🎉 ConfidentialPayoutModule deployed successfully!`);
  console.log(`Safe Address: ${targetSafe}`);
  console.log(`Module Address: ${moduleAddress}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
