"use client";

import { formatUnits } from "viem";
import { useInvisibleWallet } from "@/providers/InvisibleWalletProvider";
import { BREWFI_CONTRACT } from "@/config/contracts";

export default function TokenBrewfi() {
  const { primaryAccount, isReady } = useInvisibleWallet();
  const brewfiBalance = primaryAccount?.tokenBalances[BREWFI_CONTRACT.address];

  if (!isReady) {
    return (
      <div className="text-sm text-gray-500">
        Invisible wallet loading. Connect via onboarding to view balances.
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm text-gray-200">
      <div className="text-xs uppercase tracking-[0.3em] text-gray-500">
        BrewFi Token Balance
      </div>
      <div className="text-3xl font-bold text-cyber-blue">
        {brewfiBalance !== undefined
          ? formatUnits(brewfiBalance, 18)
          : "0.0"}
      </div>
      <div className="text-xs text-gray-500 break-all">
        {primaryAccount?.address ?? "—"}
      </div>
    </div>
  );
}
