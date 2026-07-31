import { createWalletClient, createPublicClient, http, custom } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, arbitrumSepolia } from "viem/chains";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const network = process.env.HARDHAT_NETWORK ?? "sepolia";
  console.log(`[DeployFactory] Deploying on network: ${network}`);

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

  // Load existing deployment addresses for token & master implementation
  const deployFile = resolve(process.cwd(), `deployments.${network === "arbitrumSepolia" ? "arbitrum-sepolia" : "sepolia"}.json`);
  const deployData = JSON.parse(readFileSync(deployFile, "utf8"));

  console.log(`Master implementation module: ${deployData.confidentialPayoutModule}`);
  console.log(`USDC token address: ${deployData.usdc}`);

  // Compile artifacts
  const factoryArtifact = JSON.parse(
    readFileSync(resolve(process.cwd(), "artifacts/contracts/ConfidentialPayoutFactory.sol/ConfidentialPayoutFactory.json"), "utf8")
  );

  const hash = await (walletClient.deployContract as any)({
    abi: factoryArtifact.abi,
    bytecode: factoryArtifact.bytecode as `0x${string}`,
    args: [deployData.confidentialPayoutModule, deployData.usdc],
    chain,
    account,
  });

  console.log(`Deploying factory tx hash: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const factoryAddress = receipt.contractAddress;
  console.log(`✅ ConfidentialPayoutFactory deployed at: ${factoryAddress}`);

  deployData.factory = factoryAddress;
  writeFileSync(deployFile, JSON.stringify(deployData, null, 2));
  console.log(`Updated ${deployFile} with factory address.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
