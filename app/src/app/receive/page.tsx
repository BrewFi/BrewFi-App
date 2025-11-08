'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { QRCode } from '@/components/QRCode'
import { Copy, Check } from 'lucide-react'
import { useInvisibleWallet } from '@/providers/InvisibleWalletProvider'

export default function ReceivePage() {
  const { isReady, primaryAccount } = useInvisibleWallet()
  const [copied, setCopied] = useState(false)

  const address = primaryAccount?.address ?? ''

  const handleCopy = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen flex flex-col pb-32 bg-black">
      <Navbar />

      <div className="flex-1 px-8 pt-12 pb-6 max-w-3xl mx-auto w-full space-y-6 text-center">
        <h1 className="text-4xl font-bold neon-text">Receive Assets</h1>
        <p className="text-gray-400 text-sm sm:text-base p-10">
          Share your BrewFi invisible wallet address to receive AVAX, USDC, or $BREWFI.
        </p>

        <div className="mx-auto w-64 h-64 rounded-2xl border-10 border-cyber-blue/40 flex items-center justify-center bg-white/5 p-10">
          {isReady && address ? <QRCode value={address} /> : <span className="text-xs text-gray-500">Wallet not ready</span>}
        </div>

        <div className="text-sm text-gray-400 break-all p-5">
          {isReady && address ? address : 'Sign in to view your wallet address.'}
        </div>

        <button
          onClick={handleCopy}
          disabled={!isReady || !address}
          className="mx-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/10 transition disabled:opacity-50"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Address'}
        </button>
      </div>

      <BottomNav />
    </main>
  )
}
