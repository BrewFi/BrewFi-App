'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { useInvisibleWallet } from '@/providers/InvisibleWalletProvider'
import { ArrowLeft, ExternalLink, Copy, Check, ArrowUpRight, ArrowDownLeft, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatUnits } from 'viem'
import { USDT_CONTRACT } from '@/config/contracts'

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  type: 'sent' | 'received' | 'contract'
  status: 'success' | 'failed'
  tokenSymbol?: string
  tokenAmount?: string
}

export default function TransactionHistoryPage() {
  const router = useRouter()
  const { primaryAccount, isReady } = useInvisibleWallet()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, txHash: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(txHash)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!primaryAccount?.address || !isReady) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Use Snowtrace API to fetch transactions
        const SNOWTRACE_API = 'https://api-testnet.snowtrace.io/api'
        const address = primaryAccount.address

        // Fetch normal transactions (API key is optional for testnet)
        const normalTxResponse = await fetch(
          `${SNOWTRACE_API}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc`
        )
        const normalTxData = await normalTxResponse.json()

        // Fetch token transfers
        const tokenTxResponse = await fetch(
          `${SNOWTRACE_API}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc`
        )
        const tokenTxData = await tokenTxResponse.json()

        const allTransactions: Transaction[] = []

        // Process normal transactions
        if (normalTxData.status === '1' && Array.isArray(normalTxData.result)) {
          normalTxData.result.forEach((tx: any) => {
            if (tx.value && tx.value !== '0') {
              const isSent = tx.from.toLowerCase() === address.toLowerCase()
              allTransactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                timestamp: parseInt(tx.timeStamp),
                type: isSent ? 'sent' : 'received',
                status: tx.isError === '0' ? 'success' : 'failed',
                tokenSymbol: 'AVAX',
                tokenAmount: formatUnits(BigInt(tx.value || '0'), 18),
              })
            }
          })
        } else if (normalTxData.status === '0' && normalTxData.message) {
          // API returned an error, but continue to check token transactions
          console.warn('Error fetching normal transactions:', normalTxData.message)
        }

        // Process token transactions
        if (tokenTxData.status === '1' && Array.isArray(tokenTxData.result)) {
          tokenTxData.result.forEach((tx: any) => {
            const isSent = tx.from.toLowerCase() === address.toLowerCase()
            const tokenAddress = tx.contractAddress?.toLowerCase()
            const isUSDT = tokenAddress === USDT_CONTRACT.address.toLowerCase()
            
            if (isUSDT) {
              allTransactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                timestamp: parseInt(tx.timeStamp),
                type: isSent ? 'sent' : 'received',
                status: 'success',
                tokenSymbol: 'USDT',
                tokenAmount: formatUnits(BigInt(tx.value || '0'), parseInt(tx.tokenDecimal || '6')),
              })
            }
          })
        } else if (tokenTxData.status === '0' && tokenTxData.message) {
          // API returned an error
          console.warn('Error fetching token transactions:', tokenTxData.message)
        }

        // Sort by timestamp (newest first)
        allTransactions.sort((a, b) => b.timestamp - a.timestamp)

        setTransactions(allTransactions)
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [primaryAccount?.address, isReady])

  if (!isReady || !primaryAccount) {
    return (
      <div className="min-h-screen pb-28">
        <Navbar />
        <div className="p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="cyber-card p-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Wallet not ready. Please set up your invisible wallet first.</p>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-28">
      <Navbar />
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-cyber-blue transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h2 className="text-4xl font-bold mb-4 text-cyber-blue">Transaction History</h2>
          <p className="text-gray-400">
            View all transactions for {formatAddress(primaryAccount.address)}
          </p>
        </div>

        {/* Transactions List */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="cyber-card p-6 text-center">
              <Loader2 className="w-8 h-8 text-cyber-blue animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="cyber-card p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-red-400 font-semibold mb-1">Error loading transactions</div>
                  <div className="text-red-300 text-sm">{error}</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 text-cyber-blue hover:underline text-sm"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="cyber-card p-6 text-center">
              <div className="text-gray-400 mb-4">No transactions found</div>
              <p className="text-sm text-gray-500">
                Your transaction history will appear here once you start making transactions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.hash}
                  className="cyber-card p-4 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2 rounded-lg ${
                          tx.type === 'sent'
                            ? 'bg-red-500/20 text-red-400'
                            : tx.type === 'received'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {tx.type === 'sent' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">
                            {tx.type === 'sent' ? 'Sent' : 'Received'}
                          </span>
                          {tx.status === 'failed' && (
                            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                              Failed
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 mb-2">
                          {tx.type === 'sent' ? 'To' : 'From'}: {formatAddress(tx.type === 'sent' ? tx.to : tx.from)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatDate(tx.timestamp)}</span>
                          <div className="flex items-center gap-2">
                            <code className="text-cyber-blue font-mono">
                              {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                            </code>
                            <button
                              onClick={() => copyToClipboard(tx.hash, tx.hash)}
                              className="hover:text-cyber-blue transition-colors"
                              title="Copy transaction hash"
                            >
                              {copied === tx.hash ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`font-semibold mb-1 ${tx.type === 'sent' ? 'text-red-400' : 'text-green-400'}`}>
                        {tx.type === 'sent' ? '-' : '+'}
                        {parseFloat(tx.tokenAmount || '0').toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: tx.tokenSymbol === 'AVAX' ? 6 : 2,
                        })} {tx.tokenSymbol}
                      </div>
                      <a
                        href={`https://testnet.snowtrace.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyber-blue hover:underline flex items-center gap-1 justify-end mt-1"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
