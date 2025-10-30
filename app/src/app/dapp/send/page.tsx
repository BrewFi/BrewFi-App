'use client'

import { useEffect, useMemo, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { Modal } from '@/components/ui/Modal'
import { Send as SendIcon, Check } from 'lucide-react'
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSendTransaction } from 'wagmi'
import { BREWFI_CONTRACT, USDC_CONTRACT } from '@/config/contracts'
import { isAddress, parseUnits } from 'viem'

type TokenId = 'AVAX' | 'USDC' | 'BREWFI'

const TOKEN_META: Record<TokenId, { name: string; decimals: number }> = {
  AVAX: { name: 'AVAX', decimals: 18 },
  USDC: { name: 'USDC', decimals: 6 },
  BREWFI: { name: '$BREWFI', decimals: 18 },
}

export default function SendPage() {
  const { address, isConnected } = useAccount()
  const [selectedToken, setSelectedToken] = useState<{ id: TokenId; name: string }>(() => ({ id: 'BREWFI', name: TOKEN_META.BREWFI.name }))
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [sendResult, setSendResult] = useState({ token: '', amount: '', recipient: '' })
  const [pendingTokenName, setPendingTokenName] = useState('')
  const [pendingAmount, setPendingAmount] = useState('')
  const [pendingRecipient, setPendingRecipient] = useState('')

  // Balances
  const { data: avaxBalance } = useBalance({ address, query: { enabled: !!address } })
  const { data: usdcBalance } = useReadContract({
    address: USDC_CONTRACT.address,
    abi: USDC_CONTRACT.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })
  const { data: brewfiBalance } = useReadContract({
    address: BREWFI_CONTRACT.address,
    abi: BREWFI_CONTRACT.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  const tokens = useMemo(() => [
    { id: 'AVAX' as TokenId, name: TOKEN_META.AVAX.name, balance: avaxBalance ? Number(avaxBalance.value) / 1e18 : 0 },
    { id: 'USDC' as TokenId, name: TOKEN_META.USDC.name, balance: typeof usdcBalance === 'bigint' ? Number(usdcBalance) / 1e6 : 0 },
    { id: 'BREWFI' as TokenId, name: TOKEN_META.BREWFI.name, balance: typeof brewfiBalance === 'bigint' ? Number(brewfiBalance) / 1e18 : 0 },
  ], [avaxBalance, usdcBalance, brewfiBalance])

  const selectedTokenBalance = useMemo(() => {
    const t = tokens.find(t => t.id === selectedToken.id)
    return t?.balance ?? 0
  }, [tokens, selectedToken])

  const handleMaxClick = () => {
    setAmount(selectedTokenBalance.toString())
  }

  const isValidAddress = (addr: string) => isAddress(addr)

  // Writers
  const { writeContract, data: erc20Hash, isPending: isErc20Pending, error: erc20Error } = useWriteContract()
  const { sendTransaction, data: avaxHash } = useSendTransaction()
  const { isLoading: isErc20Confirming, isSuccess: isErc20Success } = useWaitForTransactionReceipt({ hash: erc20Hash })
  const { isLoading: isAvaxConfirming, isSuccess: isAvaxSuccess } = useWaitForTransactionReceipt({ hash: avaxHash })

  // Stop sending and show success when a tx confirms
  useEffect(() => {
    if (isErc20Success || isAvaxSuccess) {
      setIsSending(false)
      setSendResult({ token: pendingTokenName, amount: pendingAmount, recipient: pendingRecipient })
      setShowSuccess(true)
    }
  }, [isErc20Success, isAvaxSuccess, pendingTokenName, pendingAmount, pendingRecipient])

  // Stop spinner on error
  useEffect(() => {
    if (erc20Error) setIsSending(false)
  }, [erc20Error])

  const handleSend = async () => {
    if (!isValidAddress(recipient)) {
      alert('Please enter a valid wallet address')
      return
    }

    if (parseFloat(amount) <= 0 || parseFloat(amount) > selectedTokenBalance) {
      alert('Invalid amount')
      return
    }

    if (!isConnected || !address) {
      alert('Connect wallet')
      return
    }

    try {
      setIsSending(true)
      setPendingTokenName(selectedToken.name)
      setPendingAmount(amount)
      setPendingRecipient(recipient)

      const decimals = TOKEN_META[selectedToken.id].decimals
      const amountWei = parseUnits(amount, decimals)

      if (selectedToken.id === 'AVAX') {
        sendTransaction({ to: recipient as `0x${string}`, value: amountWei })
      } else if (selectedToken.id === 'USDC') {
        writeContract({
          address: USDC_CONTRACT.address,
          abi: USDC_CONTRACT.abi,
          functionName: 'transfer',
          args: [recipient as `0x${string}`, amountWei]
        })
      } else {
        writeContract({
          address: BREWFI_CONTRACT.address,
          abi: BREWFI_CONTRACT.abi,
          functionName: 'transfer',
          args: [recipient as `0x${string}`, amountWei]
        })
      }
    } catch (e: any) {
      alert(e?.message || 'Transaction failed')
    } finally {
      // Keep spinner until confirmation or error effect clears it
    }
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false)
    setRecipient('')
    setAmount('')
  }

  return (
    <main className="min-h-screen flex flex-col pb-32 bg-black">
      <Navbar />

      <div className="flex-1 px-8 pt-8 pb-6 max-w-3xl mx-auto w-full">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold neon-text">
              Send Assets
            </h1>
            <p className="text-gray-400">Send tokens or crypto to friends</p>
          </div>

          {/* Token Selection Tabs */}
          <div className="flex gap-2">
              {tokens.map(token => (
              <button
                key={token.id}
                onClick={() => setSelectedToken({ id: token.id as TokenId, name: token.name })}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  selectedToken.id === token.id
                    ? 'bg-cyber-blue text-black shadow-lg shadow-cyber-blue/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <div className="text-lg">{token.name}</div>
                <div className="text-xs opacity-75">{token.balance.toFixed(4)}</div>
              </button>
            ))}
          </div>

          {/* Send Form */}
          <div className="cyber-card p-6 space-y-6">
            {/* Recipient Address */}
            <div className="space-y-2">
              <label className="block text-gray-400 text-sm">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-white focus:border-cyber-blue focus:outline-none"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="block text-gray-400 text-sm">Amount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-white focus:border-cyber-blue focus:outline-none"
                />
                <div className="px-4 py-3 bg-black/50 border border-cyber-blue/30 rounded-lg text-cyber-blue font-semibold">{selectedToken.name}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Balance: {selectedTokenBalance.toFixed(6)} {selectedToken.name}
                </div>
                <button
                  onClick={handleMaxClick}
                  className="text-sm text-cyber-blue hover:brightness-110 font-semibold"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!recipient || !amount || parseFloat(amount) <= 0 || isSending || !isConnected}
              className="w-full bg-cyber-blue text-black font-bold py-4 rounded-lg hover:shadow-lg hover:shadow-cyber-blue/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110"
            >
              {isSending || isErc20Pending || isErc20Confirming || isAvaxConfirming ? <>Sending...</> : <><SendIcon className="w-5 h-5" />Send {selectedToken.name}</>}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal isOpen={showSuccess} onClose={handleCloseSuccess}>
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-cyber-blue/20 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-cyber-blue drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Transaction Sent!</h2>
            <p className="text-gray-400">Your transfer has been completed successfully</p>
          </div>

          <div className="bg-black/50 rounded-lg p-4 space-y-2 text-left border border-cyber-blue/30">
            <div className="flex justify-between">
              <span className="text-gray-400">Token:</span>
              <span className="text-cyber-blue font-semibold">{sendResult.token}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-cyber-blue font-semibold">{sendResult.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">To:</span>
              <span className="text-cyber-blue font-semibold text-xs">
                {sendResult.recipient.slice(0, 10)}...{sendResult.recipient.slice(-8)}
              </span>
            </div>
          </div>

          <button
            onClick={handleCloseSuccess}
            className="w-full bg-cyber-blue text-black font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-cyber-blue/50 transition-all hover:brightness-110"
          >
            OK
          </button>
        </div>
      </Modal>

      <BottomNav />
    </main>
  )
}
