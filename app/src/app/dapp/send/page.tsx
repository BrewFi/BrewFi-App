'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { Modal } from '@/components/ui/Modal'
import { Send as SendIcon, Check } from 'lucide-react'

// Mock token data
const tokens = [
  { id: 'BREWFI', name: '$BREWFI', balance: 1250 },
  { id: 'USDC', name: 'USDC', balance: 500 },
  { id: 'SOL', name: 'SOL', balance: 2.5 },
]

export default function SendPage() {
  const [selectedToken, setSelectedToken] = useState(tokens[0])
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [sendResult, setSendResult] = useState({ token: '', amount: '', recipient: '' })

  const handleMaxClick = () => {
    setAmount(selectedToken.balance.toString())
  }

  const isValidAddress = (address: string) => {
    // Basic validation - starts with 0x and has reasonable length
    return address.startsWith('0x') && address.length >= 10
  }

  const handleSend = async () => {
    if (!isValidAddress(recipient)) {
      alert('Please enter a valid wallet address')
      return
    }

    if (parseFloat(amount) <= 0 || parseFloat(amount) > selectedToken.balance) {
      alert('Invalid amount')
      return
    }

    setIsSending(true)
    
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setSendResult({
      token: selectedToken.name,
      amount: amount,
      recipient: recipient
    })
    
    setIsSending(false)
    setShowSuccess(true)
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
                onClick={() => setSelectedToken(token)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  selectedToken.id === token.id
                    ? 'bg-cyber-blue text-black shadow-lg shadow-cyber-blue/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <div className="text-lg">{token.name}</div>
                <div className="text-xs opacity-75">{token.balance}</div>
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
                <div className="px-4 py-3 bg-black/50 border border-cyber-blue/30 rounded-lg text-cyber-blue font-semibold">
                  {selectedToken.name}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Balance: {selectedToken.balance} {selectedToken.name}
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
              disabled={!recipient || !amount || parseFloat(amount) <= 0 || isSending}
              className="w-full bg-cyber-blue text-black font-bold py-4 rounded-lg hover:shadow-lg hover:shadow-cyber-blue/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110"
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <SendIcon className="w-5 h-5" />
                  Send {selectedToken.name}
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

