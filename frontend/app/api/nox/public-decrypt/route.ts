import { type NextRequest, NextResponse } from "next/server";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia, sepolia } from "viem/chains";
import { createViemHandleClient } from "@iexec-nox/handle";

function getNetworkConfig(chainId: number) {
  if (chainId === sepolia.id) {
    return {
      chain: sepolia,
      rpc: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://11155111.rpc.thirdweb.com",
      privateKey:
        process.env.SEPOLIA_PRIVATE_KEY ??
        process.env.DEPLOYER_PRIVATE_KEY ??
        process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY,
    };
  }

  return {
    chain: arbitrumSepolia,
    rpc:
      process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL ??
      "https://sepolia-rollup.arbitrum.io/rpc",
    privateKey: process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY,
  };
}

function getWalletClient(chainId: number) {
  const { chain, rpc, privateKey } = getNetworkConfig(chainId);
  if (!privateKey) throw new Error(`Private key not set for chain ${chainId}`);
  const pk = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(pk as `0x${string}`);
  return createWalletClient({
    account,
    chain,
    transport: http(rpc),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { amountHandle, debitSuccessHandle, chainId } = (await req.json()) as {
      amountHandle: `0x${string}`;
      debitSuccessHandle: `0x${string}`;
      chainId?: number;
    };

    if (!amountHandle || !debitSuccessHandle) {
      return NextResponse.json(
        { error: "Missing required fields: amountHandle, debitSuccessHandle" },
        { status: 400 },
      );
    }

    const walletClient = getWalletClient(chainId ?? arbitrumSepolia.id);
    const handleClient = await createViemHandleClient(walletClient);

    const [amountResult, debitSuccessResult] = await Promise.all([
      handleClient.publicDecrypt(amountHandle),
      handleClient.publicDecrypt(debitSuccessHandle),
    ]);

    return NextResponse.json({
      amountProof: amountResult.decryptionProof,
      debitSuccessProof: debitSuccessResult.decryptionProof,
      amountValue: amountResult.value.toString(),
      debitSuccessValue: debitSuccessResult.value.toString(),
    });
  } catch (err: unknown) {
    console.error("[/api/nox/public-decrypt]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
