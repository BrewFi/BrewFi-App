"use client";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { PURCHASE_CONTRACT, USDC_CONTRACT } from "@/config/contracts";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface BuyWithUSDCProps {
  productId: number;
  priceUSD: string; // Price in USD (as string to handle big numbers, scaled by 1e6 for USDC)
  onSuccess?: () => void;
}

type TransactionStep = "idle" | "approving" | "purchasing" | "success" | "error";

export default function BuyWithUSDC({ productId, priceUSD, onSuccess }: BuyWithUSDCProps) {
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState<TransactionStep>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Convert price to BigInt (priceUSD is in USDC format, 6 decimals)
  const priceAmount = BigInt(priceUSD);

  // Read USDC balance
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: USDC_CONTRACT.address,
    abi: USDC_CONTRACT.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  // Read current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_CONTRACT.address,
    abi: USDC_CONTRACT.abi,
    functionName: "allowance",
    args: address && isConnected ? [address, PURCHASE_CONTRACT.address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  // Approve transaction
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract();

  // Purchase transaction
  const {
    writeContract: writePurchase,
    data: purchaseHash,
    isPending: isPurchasePending,
    error: purchaseError,
  } = useWriteContract();

  // Wait for approve transaction
  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveReceiptError,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Wait for purchase transaction
  const {
    isLoading: isPurchaseConfirming,
    isSuccess: isPurchaseSuccess,
    error: purchaseReceiptError,
  } = useWaitForTransactionReceipt({
    hash: purchaseHash,
  });

  // Narrow read results to bigint
  const allowanceBig = typeof allowance === 'bigint' ? allowance : undefined;
  const usdcBalanceBig = typeof usdcBalance === 'bigint' ? usdcBalance : undefined;

  // Check if approval is needed
  const needsApproval = allowanceBig !== undefined && allowanceBig < priceAmount;

  // Handle approval flow - trigger purchase automatically after approval
  useEffect(() => {
    if (isApproveSuccess && !isPurchasePending && !purchaseHash) {
      setStep("purchasing");
      refetchAllowance();
      // Small delay to ensure allowance is updated
      setTimeout(() => {
        writePurchase({
          address: PURCHASE_CONTRACT.address,
          abi: PURCHASE_CONTRACT.abi,
          functionName: "purchaseWithUSDC",
          args: [BigInt(productId)],
        });
      }, 1000);
    }
  }, [isApproveSuccess, isPurchasePending, purchaseHash, refetchAllowance, writePurchase, productId]);

  // Handle purchase success
  useEffect(() => {
    if (isPurchaseSuccess) {
      setStep("success");
      refetchBalance();
      refetchAllowance();
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    }
  }, [isPurchaseSuccess, onSuccess, refetchBalance, refetchAllowance]);

  // Handle errors
  useEffect(() => {
    const error = approveError || approveReceiptError || purchaseError || purchaseReceiptError;
    if (error) {
      setStep("error");
      setErrorMessage(error.message || "Transaction failed. Please try again.");
    }
  }, [approveError, approveReceiptError, purchaseError, purchaseReceiptError]);

  const handleApprove = async () => {
    if (!isConnected || !address) {
      setErrorMessage("Please connect your wallet");
      return;
    }

    setStep("approving");
    setErrorMessage("");

    try {
      writeApprove({
        address: USDC_CONTRACT.address,
        abi: USDC_CONTRACT.abi,
        functionName: "approve",
        args: [PURCHASE_CONTRACT.address, priceAmount],
      });
    } catch (error: any) {
      setStep("error");
      setErrorMessage(error.message || "Failed to approve USDC");
    }
  };

  const handlePurchase = async () => {
    if (!isConnected || !address) {
      setErrorMessage("Please connect your wallet");
      return;
    }

    setStep("purchasing");
    setErrorMessage("");

    try {
      writePurchase({
        address: PURCHASE_CONTRACT.address,
        abi: PURCHASE_CONTRACT.abi,
        functionName: "purchaseWithUSDC",
        args: [BigInt(productId)],
      });
    } catch (error: any) {
      setStep("error");
      setErrorMessage(error.message || "Failed to process purchase");
    }
  };

  const handleBuy = async () => {
    if (needsApproval) {
      await handleApprove();
    } else {
      await handlePurchase();
    }
  };

  // Check if user has enough balance
  const hasEnoughBalance = usdcBalanceBig !== undefined && usdcBalanceBig >= priceAmount;

  // Determine button text and state
  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (!hasEnoughBalance) return "Insufficient USDC Balance";
    if (step === "approving" || isApprovePending || isApproveConfirming)
      return "Approving USDC...";
    if (step === "purchasing" || isPurchasePending || isPurchaseConfirming)
      return "Processing Purchase...";
    if (step === "success") return "Purchase Complete! 🎉";
    if (needsApproval) return "Approve & Buy";
    return "Buy with USDC";
  };

  const isButtonDisabled =
    !isConnected ||
    !hasEnoughBalance ||
    step === "approving" ||
    step === "purchasing" ||
    isApprovePending ||
    isPurchasePending ||
    isApproveConfirming ||
    isPurchaseConfirming ||
    step === "success";

  return (
    <div className="space-y-4">
      {/* USDC Balance Display */}
      {isConnected && usdcBalanceBig !== undefined && (
        <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Your USDC Balance:</span>
            <span className="text-white font-semibold">
              {(Number(usdcBalanceBig) / 1e6).toFixed(2)} USDC
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-gray-400">Required:</span>
            <span className="text-cyber-blue font-semibold">
              {(Number(priceAmount) / 1e6).toFixed(2)} USDC
            </span>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {(step === "approving" || step === "purchasing") && (
        <div className="bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-cyber-blue animate-spin" />
            <div className="flex-1">
              <div className="text-white font-semibold">
                {step === "approving" ? "Approving USDC..." : "Processing Purchase..."}
              </div>
              <div className="text-gray-400 text-sm">
                {step === "approving"
                  ? "Please confirm the transaction in your wallet"
                  : "Your purchase is being processed"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {step === "success" && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div className="flex-1">
              <div className="text-white font-semibold">
                Purchase complete! 🎉 BrewFi rewards earned ✅
              </div>
              <div className="text-gray-400 text-sm">Transaction confirmed on blockchain</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {step === "error" && errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <div className="text-white font-semibold">Transaction Failed</div>
              <div className="text-red-400 text-sm">{errorMessage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Buy Button */}
      <button
        onClick={handleBuy}
        disabled={isButtonDisabled}
        className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
          step === "success"
            ? "bg-green-500/20 border border-green-500/50 text-green-400 cursor-not-allowed"
            : isButtonDisabled
            ? "bg-gray-600/50 border border-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-cyber-blue text-black hover:bg-cyber-blue/90 hover:shadow-lg hover:shadow-cyber-blue/50 hover:scale-[1.02]"
        }`}
      >
        {(step === "approving" ||
          step === "purchasing" ||
          isApprovePending ||
          isPurchasePending ||
          isApproveConfirming ||
          isPurchaseConfirming) && <Loader2 className="w-5 h-5 animate-spin" />}
        {step === "success" && <CheckCircle2 className="w-5 h-5" />}
        {getButtonText()}
      </button>

      {/* Transaction Hashes */}
      {approveHash && (
        <div className="text-xs text-gray-500 text-center">
          Approval: {approveHash.slice(0, 10)}...{approveHash.slice(-8)}
        </div>
      )}
      {purchaseHash && (
        <div className="text-xs text-gray-500 text-center">
          Purchase: {purchaseHash.slice(0, 10)}...{purchaseHash.slice(-8)}
        </div>
      )}
    </div>
  );
}
