'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { Send as SendIcon } from 'lucide-react'
import { useInvisibleWallet } from '@/providers/InvisibleWalletProvider'
import { formatUnits, parseUnits } from 'viem'
import { USDT_CONTRACT } from '@/config/contracts'

const TOKENS = [
  { id: 'AVAX' as const, label: 'AVAX', decimals: 18 },
  { id: 'USDT' as const, label: 'USDT', decimals: 6 },
]

type TokenId = (typeof TOKENS)[number]['id']

export default function SendPage() {
  const { isReady, primaryAccount, sendNative, transferToken } = useInvisibleWallet()
  const [token, setToken] = useState<TokenId>('AVAX')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const balances = {
    AVAX: primaryAccount ? formatUnits(primaryAccount.balanceWei, 18) : '0.0',
    USDT:
      primaryAccount?.tokenBalances[USDT_CONTRACT.address] !== undefined
        ? formatUnits(primaryAccount.tokenBalances[USDT_CONTRACT.address], 6)
        : '0.0',
  }

  const handleSend = async () => {
    if (!isReady) {
      setStatus('error')
      setMessage('Invisible wallet not ready')
      return
    }
    if (!recipient || !amount) {
      setStatus('error')
      setMessage('Recipient and amount are required')
      return
    }

    const tokenMeta = TOKENS.find((t) => t.id === token)!

    try {
      setStatus('pending')
      setMessage(null)

      if (token === 'AVAX') {
        const result = await sendNative({
          index: 0,
          to: recipient as `0x${string}`,
          value: parseUnits(amount, tokenMeta.decimals),
        })
        setStatus('success')
        setMessage(`Tx hash: ${result.hash}`)
      } else {
        const result = await transferToken({
          index: 0,
          token: USDT_CONTRACT.address,
          recipient: recipient as `0x${string}`,
          amount: parseUnits(amount, tokenMeta.decimals),
        })
        setStatus('success')
        setMessage(`Tx hash: ${result.hash}`)
      }

      setAmount('')
      setRecipient('')
    } catch (err) {
      setStatus('error')
      setMessage((err as Error).message ?? 'Unable to send transaction')
    }
  }

  return (
    <main className="min-h-screen flex flex-col pb-32 bg-black">
      <Navbar />

      <div className="flex-1 px-8 pt-8 pb-6 max-w-3xl mx-auto w-full space-y-6">
        <div className="text-center space-y-2">
          <SendIcon className="w-14 h-14 text-cyber-blue mx-auto" />
          <h1 className="text-4xl font-bold neon-text">Send Assets</h1>
          <p className="text-gray-400">
            Transfer AVAX or USDT directly from your invisible wallet.
          </p>
        </div>

        <div className="cyber-card p-6 space-y-5">
          <div className="flex gap-2">
            {TOKENS.map((item) => (
              <button
                key={item.id}
                onClick={() => setToken(item.id)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  token === item.id
                    ? 'bg-cyber-blue text-black shadow-lg shadow-cyber-blue/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="text-sm text-gray-500">
            Balance: {balances[token]} {token}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400" htmlFor="recipient">
              Recipient Address
            </label>
            <input
              id="recipient"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="0x..."
              className="w-full bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-sm text-white focus:border-cyber-blue focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400" htmlFor="amount">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="w-full bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-sm text-white focus:border-cyber-blue focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!isReady || status === 'pending'}
            className="w-full bg-cyber-blue text-black font-bold py-3 rounded-lg hover:brightness-110 transition disabled:opacity-50"
          >
            {status === 'pending' ? 'Sending...' : `Send ${token}`}
          </button>

          {status === 'success' && message && (
            <div className="text-xs text-green-400 break-all">{message}</div>
          )}
          {status === 'error' && message && (
            <div className="text-xs text-red-400 break-all">{message}</div>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  )
}
