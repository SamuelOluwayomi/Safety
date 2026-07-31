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

function getWalletClient(owner: `0x${string}`, chainId: number) {
  const { chain, rpc, privateKey } = getNetworkConfig(chainId);
  if (!privateKey) throw new Error(`Private key not set for chain ${chainId}`);
  const pk = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(pk as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpc),
  });

  return {
    ...walletClient,
    getAddresses: async () => [owner],
    getAddress: async () => owner,
    account: {
      ...walletClient.account,
      address: owner,
    },
  } as any;
}

export async function POST(req: NextRequest) {
  try {
    const { amount, owner, appContract, chainId } = (await req.json()) as {
      amount: string;
      owner: `0x${string}`;
      appContract: `0x${string}`;
      chainId?: number;
    };

    if (!amount || !owner || !appContract) {
      return NextResponse.json(
        { error: "Missing required fields: amount, owner, appContract" },
        { status: 400 },
      );
    }

    const walletClient = getWalletClient(owner, chainId ?? arbitrumSepolia.id);
    const handleClient = await createViemHandleClient(walletClient);

    const { handle, handleProof } = await handleClient.encryptInput(
      BigInt(amount),
      "uint256",
      appContract,
    );

    return NextResponse.json({ handle, proof: handleProof });
  } catch (err: unknown) {
    console.error("[/api/nox/encrypt]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
