"use client";
// this file shows you a simple method of reading data from the blockchain
import { useReadContract } from "wagmi"
import { useAccount } from "wagmi"
import { tokenAbi } from "./tokenAbi";
import { useChainId } from "wagmi";

const ReadData2 = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  console.log('chain id', chainId);

  // get the balance of the connected address
  const { data: balance } = useReadContract({
    address: tokenAbi.address as `0x${string}`,
    abi: tokenAbi.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })
  // get the token name
  const { data: tokenName } = useReadContract({
    address: tokenAbi.address as `0x${string}`,
    abi: tokenAbi.abi,
    functionName: 'name',
    args: [],
  })
  // get the total supply of the token
  const { data: totalSupply } = useReadContract({
    address: tokenAbi.address as `0x${string}`,
    abi: tokenAbi.abi,
    functionName: 'totalSupply',
    args: [],
  })

  return (
    <div className="bg-neutral-900 my-8  rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-medium text-neutral-100 mb-4 border-b border-neutral-200 pb-2">
        Token Information
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 px-3 bg-neutral-900 rounded border border-neutral-100">
          <span className="text-sm font-medium text-neutral-100">Token Name:</span>
          <span className="text-sm text-neutral-200">{tokenName?.toString() || "Loading..."}</span>
        </div>

        <div className="flex justify-between items-center py-2 px-3 bg-neutral-900 rounded border border-neutral-100">
          <span className="text-sm font-medium text-neutral-100">Balance:</span>
          <span className="text-sm text-neutral-200 font-mono">{balance?.toString() || "0.00"}</span>
        </div>

        <div className="flex justify-between items-center py-2 px-3 bg-neutral-900 rounded border border-neutral-100">
          <span className="text-sm font-medium text-neutral-100">Total Supply:</span>
          <span className="text-sm text-neutral-200 font-mono">{totalSupply?.toString() || "0.00"}</span>
        </div>
      </div>
    </div>
  )
}

export default ReadData2