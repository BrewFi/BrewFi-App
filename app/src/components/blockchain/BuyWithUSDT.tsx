"use client";

import { useState, useMemo, useEffect } from "react";
import { formatUnits, encodeFunctionData } from "viem";
import { USDT_CONTRACT, PURCHASE_CONTRACT } from "@/config/contracts";
import { useInvisibleWallet } from "@/providers/InvisibleWalletProvider";
import { createContractReader } from "@/lib/contractReader";
import { notifyPaymentWebhook } from "@/lib/qrPaymentWebhook";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

interface BuyWithUSDTProps {
  productId: number;
  priceUSD: string; // USDT price scaled by 1e6
  sessionId?: string; // QR payment session ID for webhook notification
  onSuccess?: () => void;
}

type StepState = "idle" | "checking" | "approving" | "purchasing" | "success" | "error";

export default function BuyWithUSDT({
  productId,
  priceUSD,
  sessionId,
  onSuccess,
}: BuyWithUSDTProps) {
  const { isReady, primaryAccount, callContract, refresh } = useInvisibleWallet();
  const [status, setStatus] = useState<StepState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [approvalHash, setApprovalHash] = useState<string | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);

  const priceAmount = BigInt(priceUSD);
  const humanPrice = formatUnits(priceAmount, 6);

  // Get USDT balance from primary account
  const usdtBalance = useMemo(() => {
    if (!primaryAccount) return 0n;
    return primaryAccount.tokenBalances[USDT_CONTRACT.address] ?? 0n;
  }, [primaryAccount]);

  const hasEnoughBalance = useMemo(() => {
    return usdtBalance >= priceAmount;
  }, [usdtBalance, priceAmount]);

  const balanceDisplay = formatUnits(usdtBalance, 6);
  const shortfall = hasEnoughBalance ? 0n : priceAmount - usdtBalance;
  const shortfallDisplay = formatUnits(shortfall, 6);

  // Refresh balance after successful purchase (wait for transaction confirmation)
  // Also notify webhook if sessionId is provided
  useEffect(() => {
    if (status === "success" && txHash) {
      const waitAndRefresh = async () => {
        setRefreshingBalance(true);
        try {
          const client = createContractReader();
          // Wait for transaction to be confirmed
          await client.waitForTransactionReceipt({
            hash: txHash as `0x${string}`,
            timeout: 30_000, // 30 seconds timeout
          });
          // Wait a bit more for balance to update on-chain
          await new Promise((resolve) => setTimeout(resolve, 2000));
          
          // Notify webhook if sessionId is provided (for QR payments)
          if (sessionId && primaryAccount) {
            try {
              await notifyPaymentWebhook(
                sessionId,
                txHash,
                primaryAccount.address,
                "USDT",
                priceUSD
              );
              console.log("Payment webhook notified successfully");
            } catch (webhookError) {
              console.error("Error notifying webhook:", webhookError);
              // Don't fail the payment if webhook fails
            }
          }
          
          // Refresh balance
          await refresh();
          // Give it a moment for state to update
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (err) {
          console.error("Error waiting for transaction confirmation:", err);
          // Still try to refresh even if wait fails
          setTimeout(async () => {
            await refresh();
            setRefreshingBalance(false);
          }, 5000);
          return;
        }
        setRefreshingBalance(false);
      };
      waitAndRefresh();
    }
  }, [status, txHash, refresh, sessionId, primaryAccount, priceUSD]);

  const handlePurchase = async () => {
    if (!isReady || !primaryAccount) {
      setError("Wallet not ready yet.");
      return;
    }

    if (!hasEnoughBalance) {
      setError(`Insufficient USDT balance. Need ${humanPrice} USDT, but only have ${balanceDisplay} USDT.`);
      return;
    }

    setStatus("checking");
    setError(null);
    setCheckingBalance(true);

    try {
      const client = createContractReader();

      // Check current allowance
      const currentAllowance = (await client.readContract({
        address: USDT_CONTRACT.address,
        abi: USDT_CONTRACT.abi,
        functionName: "allowance",
        args: [primaryAccount.address as `0x${string}`, PURCHASE_CONTRACT.address],
      })) as bigint;

      setCheckingBalance(false);

      // Approve if needed
      if (currentAllowance < priceAmount) {
        setStatus("approving");
        const approveData = encodeFunctionData({
          abi: USDT_CONTRACT.abi,
          functionName: "approve",
          args: [PURCHASE_CONTRACT.address, priceAmount],
        });

        try {
          const approveResult = await callContract({
            to: USDT_CONTRACT.address,
            data: approveData,
          });
          setApprovalHash(approveResult.hash);
          
          // Wait a moment for the approval transaction to be mined
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (approveErr) {
          setStatus("error");
          setError(
            `Approval failed: ${approveErr instanceof Error ? approveErr.message : "Unknown error"}`,
          );
          return;
        }
      }

      setStatus("purchasing");

      // Encode the purchase function call
      const purchaseData = encodeFunctionData({
        abi: PURCHASE_CONTRACT.abi,
        functionName: "purchaseWithUSDT",
        args: [BigInt(productId)],
      });

      // Call the purchase function
      const result = await callContract({
        to: PURCHASE_CONTRACT.address,
        data: purchaseData,
      });

      setStatus("success");
      setTxHash(result.hash);
      
      // Note: Balance refresh will happen in useEffect after transaction confirmation
      
      if (onSuccess) {
        // Delay onSuccess to allow transaction to be processed
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (err) {
      setStatus("error");
      setError((err as Error).message ?? "Unable to complete purchase");
      setCheckingBalance(false);
    }
  };

  const isProcessing = status === "checking" || status === "approving" || status === "purchasing";
  const isDisabled = !isReady || !hasEnoughBalance || isProcessing;

  return (
    <div className="space-y-3">
      {/* Balance Display */}
      <div className="bg-black/50 border border-cyber-blue/30 rounded-lg p-3 space-y-2">
        {!isReady && (
          <div className="text-xs text-yellow-400 text-center py-1">
            Wallet not connected
          </div>
        )}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Your USDT Balance:</span>
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${hasEnoughBalance ? "text-cyber-blue" : "text-red-400"}`}>
              {balanceDisplay} USDT
            </span>
            <button
              type="button"
              onClick={async () => {
                setRefreshingBalance(true);
                await refresh();
                setTimeout(() => setRefreshingBalance(false), 1000);
              }}
              disabled={refreshingBalance || !isReady}
              className="p-1 hover:bg-cyber-blue/20 rounded transition disabled:opacity-50"
              title="Refresh balance"
            >
              <Loader2 className={`w-3 h-3 ${refreshingBalance ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Price:</span>
          <span className="text-cyber-blue font-semibold">{humanPrice} USDT</span>
        </div>
        {!hasEnoughBalance && (
          <div className="flex justify-between items-center text-xs pt-1 border-t border-red-500/20">
            <span className="text-red-400">Shortfall:</span>
            <span className="text-red-400 font-semibold">{shortfallDisplay} USDT</span>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {status === "approving" && (
        <div className="bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 text-cyber-blue animate-spin" />
            <span className="text-cyber-blue">Approving USDT spending...</span>
          </div>
        </div>
      )}

      {status === "purchasing" && (
        <div className="bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 text-cyber-blue animate-spin" />
            <span className="text-cyber-blue">Processing purchase...</span>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold">Purchase successful! 🎉</span>
          </div>
          {refreshingBalance && (
            <div className="flex items-center gap-2 text-xs text-green-300 mt-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Updating balance...</span>
            </div>
          )}
          {!refreshingBalance && (
            <div className="text-xs text-green-300 mt-1">
              Balance updated!
            </div>
          )}
        </div>
      )}

      {/* Buy Button */}
      <button
        type="button"
        onClick={handlePurchase}
        disabled={isDisabled}
        className={`w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
          status === "success"
            ? "bg-green-500/20 border border-green-500/50 text-green-400 cursor-not-allowed"
            : isDisabled
            ? "bg-gray-600/50 border border-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-cyber-blue text-black hover:bg-cyber-blue/90 hover:shadow-lg hover:shadow-cyber-blue/50 hover:scale-[1.02]"
        }`}
      >
        {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
        {status === "success" && <CheckCircle2 className="w-5 h-5" />}
        {status === "checking" && "Checking..."}
        {status === "approving" && "Approving..."}
        {status === "purchasing" && "Purchasing..."}
        {status === "success" && "Purchase Complete!"}
        {status === "idle" && !hasEnoughBalance && "Insufficient Balance"}
        {status === "idle" && hasEnoughBalance && "Buy with USDT"}
        {status === "error" && "Try Again"}
      </button>

      {/* Transaction Hashes */}
      {approvalHash && (
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <span>Approval:</span>
            <a
              href={`https://testnet.snowtrace.io/tx/${approvalHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber-blue hover:underline flex items-center gap-1"
            >
              {approvalHash.slice(0, 8)}...{approvalHash.slice(-6)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {status === "success" && txHash && (
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-green-400">Purchase:</span>
            <a
              href={`https://testnet.snowtrace.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber-blue hover:underline flex items-center gap-1"
            >
              {txHash.slice(0, 8)}...{txHash.slice(-6)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === "error" && error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-red-400 font-semibold">Transaction Failed</div>
              <div className="text-red-300 text-xs mt-1">{error}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setError(null);
              setTxHash(null);
              setApprovalHash(null);
            }}
            className="w-full px-3 py-2 text-xs bg-red-500/20 border border-red-500/50 text-red-400 rounded hover:bg-red-500/30 transition"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
