import { NextResponse } from "next/server";
import {
  createWalletClient,
  createPublicClient,
  http,
  isAddress,
  encodeFunctionData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, arbitrumSepolia } from "viem/chains";
import { readFileSync } from "fs";
import { resolve } from "path";
import { DEPLOYMENTS, type NetworkKey } from "@/lib/deployments";
import { MODULE_ABI } from "@/lib/contracts";

// Cache deployed modules in memory per safe per network
const moduleCache: Record<string, string> = {};

export async function POST(req: Request) {
  try {
    const {
      safeAddress,
      networkKey = "sepolia",
      forceRedeploy = false,
    } = (await req.json()) as {
      safeAddress: string;
      networkKey?: NetworkKey;
      forceRedeploy?: boolean;
    };

    if (!safeAddress || !isAddress(safeAddress)) {
      return NextResponse.json({ error: "Invalid safe address" }, { status: 400 });
    }

    const cacheKey = `${networkKey}:${safeAddress.toLowerCase()}`;
    if (!forceRedeploy && moduleCache[cacheKey]) {
      console.log(`[deploy-module] Cache hit for ${cacheKey} → ${moduleCache[cacheKey]}`);
      return NextResponse.json({ moduleAddress: moduleCache[cacheKey] });
    }

    const deployment = DEPLOYMENTS[networkKey];
    if (!deployment) {
      return NextResponse.json({ error: "Unsupported network" }, { status: 400 });
    }

    // If it's the demo safe, return default module
    if (safeAddress.toLowerCase() === deployment.addresses.safe.toLowerCase()) {
      return NextResponse.json({ moduleAddress: deployment.addresses.module });
    }

    const rawPk =
      process.env.DEPLOYER_PRIVATE_KEY ??
      process.env.SEPOLIA_PRIVATE_KEY ??
      process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY;
    if (!rawPk) {
      return NextResponse.json(
        { error: "Deployer key not configured on server" },
        { status: 500 },
      );
    }

    const pk = (rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`) as `0x${string}`;
    const account = privateKeyToAccount(pk);
    const chain = networkKey === "arbitrumSepolia" ? arbitrumSepolia : sepolia;

    const rpcUrl =
      networkKey === "arbitrumSepolia"
        ? (process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL ?? "https://sepolia-rollup.arbitrum.io/rpc")
        : (process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com");

    const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
    const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });

    // Load compiled bytecode of ConfidentialPayoutModule from JSON file
    const artifactPath = resolve(process.cwd(), "lib/contracts/ConfidentialPayoutModule.json");
    const moduleArtifact = JSON.parse(readFileSync(artifactPath, "utf8"));

    // ── Step 1: Deploy contract (empty constructor, no Nox calls) ──
    console.log(`[deploy-module] Deploying module for safe=${safeAddress} on ${networkKey}…`);

    const deployHash = await (walletClient.deployContract as any)({
      abi: moduleArtifact.abi,
      bytecode: moduleArtifact.bytecode as `0x${string}`,
      args: [],
      chain,
      account,
      gas: 3_000_000n,
    });

    const deployReceipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });

    if (deployReceipt.status !== "success") {
      console.error("[deploy-module] Deployment reverted!", deployReceipt);
      return NextResponse.json(
        { error: `Module deployment reverted. TxHash: ${deployHash}` },
        { status: 500 },
      );
    }

    const deployedModule = deployReceipt.contractAddress;
    if (!deployedModule) {
      return NextResponse.json(
        { error: "Deployment succeeded but no contract address in receipt" },
        { status: 500 },
      );
    }

    console.log(`[deploy-module] Module deployed at ${deployedModule}. Now initializing…`);

    // ── Step 2: Simulate initialize() first to catch revert reasons ──
    try {
      await publicClient.simulateContract({
        address: deployedModule,
        abi: moduleArtifact.abi,
        functionName: "initialize",
        args: [deployment.addresses.usdc, safeAddress as `0x${string}`],
        account,
      });
    } catch (simErr: any) {
      const reason = simErr?.cause?.reason ?? simErr?.shortMessage ?? simErr?.message ?? String(simErr);
      console.error("[deploy-module] initialize() simulation failed:", reason);
      return NextResponse.json(
        { error: `Module initialization would revert: ${reason}` },
        { status: 500 },
      );
    }

    // ── Step 3: Call initialize() on-chain ──
    const initHash = await walletClient.writeContract({
      address: deployedModule,
      abi: moduleArtifact.abi,
      functionName: "initialize",
      args: [deployment.addresses.usdc, safeAddress as `0x${string}`],
      chain,
      account,
      gas: 1_000_000n,
    });

    const initReceipt = await publicClient.waitForTransactionReceipt({ hash: initHash });

    if (initReceipt.status !== "success") {
      console.error("[deploy-module] initialize() reverted on-chain!", initHash);
      return NextResponse.json(
        { error: `Module initialize() reverted. TxHash: ${initHash}` },
        { status: 500 },
      );
    }

    // ── Step 4: Verify state was set correctly ──
    let onChainSafe: string | undefined;
    try {
      onChainSafe = (await publicClient.readContract({
        address: deployedModule,
        abi: MODULE_ABI,
        functionName: "safe",
      })) as string;
    } catch (readErr) {
      console.warn("[deploy-module] Could not read safe() from module:", readErr);
    }

    if (onChainSafe && onChainSafe.toLowerCase() !== safeAddress.toLowerCase()) {
      return NextResponse.json(
        {
          error: `Module initialized with wrong safe address. Got: ${onChainSafe}, expected: ${safeAddress}`,
        },
        { status: 500 },
      );
    }

    console.log(`[deploy-module] ✅ Module initialized. safe()=${onChainSafe}`);

    moduleCache[cacheKey] = deployedModule;
    return NextResponse.json({ moduleAddress: deployedModule, txHash: deployHash });
  } catch (err: any) {
    console.error("[/api/safe/deploy-module]", err);
    return NextResponse.json(
      { error: err?.message ?? "Module deployment failed" },
      { status: 500 },
    );
  }
}
