'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { QRScanner } from '@/components/QRScanner'
import { formatUnits } from 'viem'
import { Scan, AlertCircle } from 'lucide-react'
import BuyWithUSDC from '@/components/blockchain/BuyWithUSDC'
import BuyWithUSDT from '@/components/blockchain/BuyWithUSDT'

// Payment session data structure
interface PaymentQRData {
  sessionId: string
  walletAddress: string
  productId?: number
  amount: string
  timestamp: number
  expiresAt: number
  productName?: string
}

// Parse QR code data
function parseQRData(qrText: string): PaymentQRData | null {
  try {
    const data = JSON.parse(qrText)
    if (
      data.sessionId &&
      data.walletAddress &&
      data.amount &&
      data.timestamp &&
      data.expiresAt
    ) {
      return data as PaymentQRData
    }
    return null
  } catch {
    return null
  }
}

// Check if session is expired
function isSessionExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt
}

type PaymentMethod = 'USDC' | 'USDT'

const getEmojiForProduct = (name: string): string => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('espresso')) return '☕'
  if (lowerName.includes('latte')) return '🥛'
  if (lowerName.includes('cold') || lowerName.includes('brew')) return '🧊'
  if (lowerName.includes('cappuccino')) return '☕'
  if (lowerName.includes('mocha')) return '🍫'
  return '☕'
}

export default function QRPayPage() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('USDC')
  const [scannedData, setScannedData] = useState<PaymentQRData | null>(null)
  const [showScanner, setShowScanner] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Auto-open scanner when page loads
  useEffect(() => {
    setShowScanner(true)
  }, [])

  // Handle QR scan
  const handleScanSuccess = (decodedText: string) => {
    setShowScanner(false)
    const parsed = parseQRData(decodedText)
    
    if (!parsed) {
      setError('Invalid QR code format')
      return
    }

    if (isSessionExpired(parsed.expiresAt)) {
      setError('This payment QR code has expired')
      return
    }

    setScannedData(parsed)
    setError(null)
  }

  const handleScanError = (error: string) => {
    setError(`Scan error: ${error}`)
  }

  const handlePaymentSuccess = () => {
    setScannedData(null)
    setError(null)
    setShowScanner(true)
  }

  return (
    <main className="min-h-screen flex flex-col pb-32 bg-black">
      <Navbar />

      {showScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onError={handleScanError}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="flex-1 px-6 pt-12 pb-6 max-w-4xl mx-auto w-full space-y-6">
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-bold neon-text">Scan QR Code</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Scan a payment QR code to pay
          </p>
        </header>

        {/* Scanner Toggle - Only show when scanner is closed and no scanned data */}
        {!showScanner && !scannedData && (
          <div className="flex justify-center">
            <button
              onClick={() => {
                setShowScanner(true)
                setError(null)
              }}
              className="px-6 py-3 bg-cyber-blue text-black font-semibold rounded-lg hover:bg-cyber-blue/90 transition flex items-center gap-2"
            >
              <Scan className="w-5 h-5" />
              Open Scanner
            </button>
          </div>
        )}

        {error && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <p className="text-yellow-400 text-sm">{error}</p>
          </div>
        )}

        {/* Payment Confirmation */}
        {scannedData && (
          <div className="space-y-6">
            <div className="cyber-card p-6 space-y-4">
              <h2 className="text-xl font-semibold">Payment Details</h2>
              
              {isSessionExpired(scannedData.expiresAt) ? (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-400">
                    This payment QR code has expired. Please ask for a new one.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-400">Product</span>
                      <div className="flex items-center gap-2">
                        <span>{scannedData.productName ? getEmojiForProduct(scannedData.productName) : '☕'}</span>
                        <span className="text-white font-semibold">
                          {scannedData.productName || 'Coffee'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-400">Amount</span>
                      <span className="text-white font-semibold">
                        ${formatUnits(BigInt(scannedData.amount), 6)} USD
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-400">Recipient</span>
                      <span className="text-white font-mono text-xs">
                        {scannedData.walletAddress.slice(0, 6)}...{scannedData.walletAddress.slice(-4)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={() => setPaymentMethod('USDC')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        paymentMethod === 'USDC'
                          ? 'bg-cyber-blue text-black'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      Pay with USDC
                    </button>
                    <button
                      onClick={() => setPaymentMethod('USDT')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        paymentMethod === 'USDT'
                          ? 'bg-cyber-blue text-black'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      Pay with USDT
                    </button>
                  </div>

                  {/* Payment Component */}
                  {scannedData.productId !== undefined && (
                    <div className="pt-4">
                      {paymentMethod === 'USDC' ? (
                        <BuyWithUSDC
                          productId={scannedData.productId}
                          priceUSD={scannedData.amount}
                          onSuccess={handlePaymentSuccess}
                        />
                      ) : (
                        <BuyWithUSDT
                          productId={scannedData.productId}
                          priceUSD={scannedData.amount}
                          onSuccess={handlePaymentSuccess}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setScannedData(null)
                  setError(null)
                  setShowScanner(true)
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
              >
                Cancel Payment
              </button>
            </div>
          </div>
        )}

        {/* Scan Mode - No Data and Scanner Closed */}
        {!scannedData && !showScanner && (
          <div className="cyber-card p-8 text-center space-y-4">
            <Scan className="w-16 h-16 text-cyber-blue mx-auto" />
            <h2 className="text-xl font-semibold">Scan QR Code to Pay</h2>
            <p className="text-gray-400">
              Click the "Open Scanner" button to open your camera and scan a payment QR code
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
