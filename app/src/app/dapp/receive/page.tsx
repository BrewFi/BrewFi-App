'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { Copy, Check } from 'lucide-react'

// Mock token data
const tokens = [
  { id: 'BREWFI', name: '$BREWFI', address: '0x51B2C3D4E5F6789012345678901234567891EB4' },
  { id: 'USDC', name: 'USDC', address: '0x51B2C3D4E5F6789012345678901234567891EB4' },
  { id: 'SOL', name: 'SOL', address: '0x51B2C3D4E5F6789012345678901234567891EB4' },
]

export default function ReceivePage() {
  const [selectedToken, setSelectedToken] = useState(tokens[0])
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(selectedToken.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen flex flex-col pb-32 bg-black">
      <Navbar />

      <div className="flex-1 px-8 pt-8 pb-6 max-w-3xl mx-auto w-full">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold neon-text">
              Receive Assets
            </h1>
            <p className="text-gray-400">Share your wallet address to receive tokens</p>
          </div>

          {/* Token Selection Tabs */}
          <div className="flex gap-2">
            {tokens.map(token => (
              <button
                key={token.id}
                onClick={() => setSelectedToken(token)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  selectedToken.id === token.id
                    ? 'bg-cyber-blue text-black shadow-lg shadow-cyber-blue/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {token.name}
              </button>
            ))}
          </div>

          {/* QR Code and Address Display */}
          <div className="cyber-card p-8 space-y-6">
            {/* QR Code Placeholder */}
            <div className="space-y-4">
              <div className="relative mx-auto w-64 h-64 rounded-2xl overflow-hidden border-4 border-cyber-blue shadow-lg shadow-cyber-blue/50">
                {/* Gradient QR Code Placeholder */}
                <div className="w-full h-full bg-gradient-to-br from-green-500 via-pink-500 to-purple-500 flex items-center justify-center">
                  <div className="grid grid-cols-8 gap-1 p-4">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 ${
                          Math.random() > 0.5 ? 'bg-black' : 'bg-white'
                        } rounded-sm`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-center text-gray-400 font-semibold">
                QR Code
              </div>
            </div>

            {/* Wallet Address */}
            <div className="space-y-2">
              <label className="block text-gray-400 text-sm">Your Wallet Address</label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedToken.address}
                  readOnly
                  className="w-full bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 pr-12 text-white text-sm focus:border-cyber-blue focus:outline-none"
                />
                <button
                  onClick={handleCopyAddress}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-cyber-blue/20 rounded-lg transition-colors"
                  title={copied ? 'Copied!' : 'Copy address'}
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-cyber-blue drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]" />
                  ) : (
                    <Copy className="w-5 h-5 text-cyber-blue" />
                  )}
                </button>
              </div>
              {copied && (
                <div className="text-center text-cyber-blue text-sm font-semibold">
                  ✓ Address copied to clipboard!
                </div>
              )}
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyAddress}
              className="w-full bg-cyber-blue text-black font-bold py-4 rounded-lg hover:shadow-lg hover:shadow-cyber-blue/50 transition-all flex items-center justify-center gap-2 hover:brightness-110"
            >
              <Copy className="w-5 h-5" />
              Copy Address
            </button>

            {/* Info Note */}
            <div className="bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg p-4 text-sm text-gray-400">
              <p className="mb-2 font-semibold text-cyber-blue">
                How to receive {selectedToken.name}:
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Share your wallet address or QR code</li>
                <li>Wait for the sender to complete their transaction</li>
                <li>Tokens will appear in your wallet automatically</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  )
}

