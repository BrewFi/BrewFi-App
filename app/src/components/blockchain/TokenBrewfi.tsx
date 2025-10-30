"use client";
import { useAccount, useReadContract } from "wagmi";
import { BREWFI_CONTRACT } from "@/config/contracts";

export default function TokenBrewfi() {
  const { address } = useAccount();

  const { data: name } = useReadContract({
    address: BREWFI_CONTRACT.address,
    abi: BREWFI_CONTRACT.abi,
    functionName: "name",
  });

  const { data: balance } = useReadContract({
    address: BREWFI_CONTRACT.address,
    abi: BREWFI_CONTRACT.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: totalSupply } = useReadContract({
    address: BREWFI_CONTRACT.address,
    abi: BREWFI_CONTRACT.abi,
    functionName: "totalSupply",
  });

  return (
    <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
      <h3 className="text-white text-lg mb-4">BrewFi Token Info</h3>

      <div className="flex justify-between text-white">
        <span>Name:</span>
        <span>{name?.toString() || "..."}</span>
      </div>
      <div className="flex justify-between text-white">
        <span>Your Balance:</span>
        <span>{balance?.toString() || "0"}</span>
      </div>
      <div className="flex justify-between text-white">
        <span>Total Supply:</span>
        <span>{totalSupply?.toString() || "0"}</span>
      </div>
    </div>
  );
}
