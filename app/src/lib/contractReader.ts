"use client";

import { createPublicClient, http, type PublicClient } from "viem";
import { avalancheFuji } from "viem/chains";
import type { Abi } from "viem";
import { PURCHASE_CONTRACT } from "@/config/contracts";

const RPC_URL =
  process.env.NEXT_PUBLIC_AVALANCHE_RPC ??
  "https://api.avax-test.network/ext/bc/C/rpc";

/**
 * Create a public viem client for reading from contracts
 */
export function createContractReader(): PublicClient {
  return createPublicClient({
    chain: avalancheFuji,
    transport: http(RPC_URL),
  });
}

/**
 * Product structure returned from the smart contract
 */
export interface ContractProduct {
  name: string;
  priceUSD: bigint;
  rewardRatio: bigint;
  active: boolean;
}

/**
 * Fetch all products from the purchase contract
 */
export async function fetchAllProducts(): Promise<ContractProduct[]> {
  const client = createContractReader();

  try {
    const products = await client.readContract({
      address: PURCHASE_CONTRACT.address,
      abi: PURCHASE_CONTRACT.abi as Abi,
      functionName: "getAllProducts",
    });

    // The contract returns an array of tuples
    return (products as ContractProduct[]) || [];
  } catch (error) {
    console.error("Error fetching products from contract:", error);
    throw new Error(
      `Failed to fetch products: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Fetch a single product by ID from the purchase contract
 */
export async function fetchProduct(
  productId: number,
): Promise<ContractProduct | null> {
  const client = createContractReader();

  try {
    const product = await client.readContract({
      address: PURCHASE_CONTRACT.address,
      abi: PURCHASE_CONTRACT.abi as Abi,
      functionName: "getProduct",
      args: [BigInt(productId)],
    });

    return (product as ContractProduct) || null;
  } catch (error) {
    console.error(`Error fetching product ${productId} from contract:`, error);
    return null;
  }
}

/**
 * Get product count from the purchase contract
 */
export async function getProductCount(): Promise<number> {
  const client = createContractReader();

  try {
    const count = await client.readContract({
      address: PURCHASE_CONTRACT.address,
      abi: PURCHASE_CONTRACT.abi as Abi,
      functionName: "getProductCount",
    });

    return Number(count as bigint);
  } catch (error) {
    console.error("Error fetching product count from contract:", error);
    return 0;
  }
}

