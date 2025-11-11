'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { Modal } from '@/components/ui/Modal'
import { ArrowLeftRight, Check } from 'lucide-react'

// Mock token data
const tokens = [
  { id: 'BREWFI', name: '$BREWFI', balance: 1250 },
  { id: 'USDT', name: 'USDT', balance: 500 },
  { id: 'AVAX', name: 'AVAX', balance: 2.5 },
]

export default function SwapPage() {
  const [fromToken, setFromToken] = useState(tokens[0])
  const [toToken, setToToken] = useState(tokens[1])
  const [amount, setAmount] = useState('')
  const [isSwapping, setIsSwapping] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [swapResult, setSwapResult] = useState({ from: '', to: '', fromAmount: '', toAmount: '' })

  const availableToTokens = tokens.filter(token => token.id !== fromToken.id)

  const handleSwap = async () => {
    setIsSwapping(true)
    
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock exchange rate calculation (simplified)
    const toAmount = (parseFloat(amount) * 0.95).toFixed(2)
    
    setSwapResult({
      from: fromToken.name,
      to: toToken.name,
      fromAmount: amount,
      toAmount: toAmount
    })
    
    setIsSwapping(false)
    setShowSuccess(true)
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false)
    setAmount('')
  }

  const handleSwitchTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
  }

  return (
    <main className="min-h-screen flex flex-col pb-32 bg-black">
      <Navbar />

      <div className="flex-1 px-8 pt-8 pb-6 max-w-3xl mx-auto w-full">
        <div className="space-y-6">
          <h1 className="text-4xl lg:text-5xl font-bold text-center neon-text mb-8">
            Swap Tokens
          </h1>

          <div className="cyber-card p-6 space-y-6">
            {/* From Token */}
            <div className="space-y-2">
              <label className="block text-gray-400 text-sm">From</label>
              <select
                  value={fromToken.id}
                  onChange={(e) => {
                    const token = tokens.find(t => t.id === e.target.value)
                    if (token) {
                      setFromToken(token)
                      // If toToken is the same, switch it
                      if (token.id === toToken.id) {
                        const newToToken = tokens.find(t => t.id !== token.id)
                        if (newToToken) setToToken(newToToken)
                      }
                    }
                  }}
                  className="w-full bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-white focus:border-cyber-blue focus:outline-none"
                >
                {tokens.map(token => (
                  <option key={token.id} value={token.id}>
                    {token.name} (Balance: {token.balance})
                  </option>
                ))}
              </select>
              
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-2xl text-white focus:border-cyber-blue focus:outline-none"
                />
              <div className="text-sm text-gray-500">
                Balance: {fromToken.balance} {fromToken.name}
              </div>
            </div>

            {/* Switch Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSwitchTokens}
                className="p-3 bg-cyber-blue/20 rounded-full hover:scale-110 transition-transform border border-cyber-blue/50 hover:bg-cyber-blue/30"
              >
                <ArrowLeftRight className="w-6 h-6 text-cyber-blue" />
              </button>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <label className="block text-gray-400 text-sm">To</label>
              <select
                value={toToken.id}
                onChange={(e) => {
                  const token = tokens.find(t => t.id === e.target.value)
                  if (token) setToToken(token)
                }}
                className="w-full bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-white focus:border-cyber-blue focus:outline-none"
              >
                {availableToTokens.map(token => (
                  <option key={token.id} value={token.id}>
                    {token.name} (Balance: {token.balance})
                  </option>
                ))}
              </select>
              
              <div className="w-full bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-2xl text-gray-500">
                {amount ? (parseFloat(amount) * 0.95).toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-gray-500">
                Balance: {toToken.balance} {toToken.name}
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > fromToken.balance || isSwapping}
              className="w-full bg-cyber-blue text-black font-bold py-4 rounded-lg hover:shadow-lg hover:shadow-cyber-blue/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110"
            >
              {isSwapping ? (
                <>Swapping...</>
              ) : (
                <>
                  <ArrowLeftRight className="w-5 h-5" />
                  Swap Now
                </>
              )}
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
            <h2 className="text-3xl font-bold text-white mb-2">Transaction Complete!</h2>
            <p className="text-gray-400">Your swap has been executed successfully</p>
          </div>

          <div className="bg-black/50 rounded-lg p-4 space-y-2 text-left border border-cyber-blue/30">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Swapped:</span>
              <span className="text-cyber-blue font-semibold">
                {swapResult.fromAmount} {swapResult.from}
              </span>
            </div>
            <div className="flex justify-center">
              <ArrowLeftRight className="w-5 h-5 text-cyber-blue" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Received:</span>
              <span className="text-cyber-blue font-semibold">
                {swapResult.toAmount} {swapResult.to}
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
