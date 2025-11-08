'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { QRCode } from '@/components/QRCode'
import { useInvisibleWallet } from '@/providers/InvisibleWalletProvider'
import { fetchAllProducts, type ContractProduct } from '@/lib/contractReader'
import { formatUnits } from 'viem'
import { Clock, AlertCircle } from 'lucide-react'

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

// Generate unique session ID
function generateSessionId(): string {
  return `brewfi_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// Calculate expiration time (15 minutes from now)
function getExpirationTime(): number {
  return Date.now() + 15 * 60 * 1000 // 15 minutes
}

const FALLBACK_PRODUCTS = [
  { id: 0, name: 'Espresso Shot', priceUSD: '2500000', emoji: '☕' },
  { id: 1, name: 'Latte', priceUSD: '4500000', emoji: '🥛' },
  { id: 2, name: 'Cold Brew', priceUSD: '5500000', emoji: '🧊' },
]

const getEmojiForProduct = (name: string): string => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('espresso')) return '☕'
  if (lowerName.includes('latte')) return '🥛'
  if (lowerName.includes('cold') || lowerName.includes('brew')) return '🧊'
  if (lowerName.includes('cappuccino')) return '☕'
  if (lowerName.includes('mocha')) return '🍫'
  return '☕'
}

interface ProductDisplay {
  id: number
  name: string
  priceUSD: string
  emoji: string
  rewardRatio?: bigint
  active: boolean
}

export default function SellerPage() {
  const { isReady, primaryAccount } = useInvisibleWallet()
  const [products, setProducts] = useState<ProductDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [qrData, setQrData] = useState<PaymentQRData | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      try {
        const contractProducts = await fetchAllProducts()
        const mappedProducts: ProductDisplay[] = contractProducts
          .map((product: ContractProduct, index: number) => ({
            id: index,
            name: product.name,
            priceUSD: product.priceUSD.toString(),
            emoji: getEmojiForProduct(product.name),
            rewardRatio: product.rewardRatio,
            active: product.active,
          }))
          .filter((p) => p.active)

        if (mappedProducts.length > 0) {
          setProducts(mappedProducts)
          if (mappedProducts.length > 0 && selectedProduct === null) {
            setSelectedProduct(0)
          }
        } else {
          setProducts(FALLBACK_PRODUCTS.map((p) => ({ ...p, active: true })))
          setSelectedProduct(0)
        }
      } catch (err) {
        console.error('Failed to load products:', err)
        setProducts(FALLBACK_PRODUCTS.map((p) => ({ ...p, active: true })))
        setSelectedProduct(0)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  // Generate QR code data
  const generateQRCode = () => {
    if (!isReady || !primaryAccount || selectedProduct === null) {
      setError('Please select a product and ensure your wallet is ready')
      return
    }

    const product = products[selectedProduct]
    if (!product) {
      setError('Selected product not found')
      return
    }

    const sessionId = generateSessionId()
    const expiresAt = getExpirationTime()

    const data: PaymentQRData = {
      sessionId,
      walletAddress: primaryAccount.address,
      productId: product.id,
      amount: product.priceUSD,
      timestamp: Date.now(),
      expiresAt,
      productName: product.name,
    }

    setQrData(data)
    setError(null)
  }

  // Timer for expiration
  useEffect(() => {
    if (!qrData) {
      setTimeRemaining(0)
      return
    }

    const updateTimer = () => {
      const remaining = Math.max(0, qrData.expiresAt - Date.now())
      setTimeRemaining(remaining)
      
      if (remaining === 0) {
        setQrData(null)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [qrData])

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const selectedProductData = selectedProduct !== null ? products[selectedProduct] : null
  const qrCodeString = qrData ? JSON.stringify(qrData) : ''

  return (
    <main className="min-h-screen flex flex-col pb-32 bg-black">
      <Navbar />

      <div className="flex-1 px-6 pt-12 pb-6 max-w-4xl mx-auto w-full space-y-6">
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-bold neon-text">Generate Payment QR</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Create a QR code for customers to scan and pay
          </p>
        </header>

        {error && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <p className="text-yellow-400 text-sm">{error}</p>
          </div>
        )}

        {!isReady && (
          <div className="text-center py-8">
            <p className="text-gray-400">
              Please sign in and complete onboarding to generate payment QR codes
            </p>
          </div>
        )}

        {isReady && (
          <>
            {/* Product Selection */}
            {loading ? (
              <div className="cyber-card p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/2" />
                <div className="h-32 bg-gray-700 rounded" />
              </div>
            ) : (
              <div className="cyber-card p-6 space-y-4">
                <h2 className="text-xl font-semibold">Select Product</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product.id)
                        setQrData(null)
                        setError(null)
                      }}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedProduct === product.id
                          ? 'border-cyber-blue bg-cyber-blue/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{product.emoji}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            ${formatUnits(BigInt(product.priceUSD), 6)} USD
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Button */}
            {selectedProductData && (
              <div className="flex justify-center">
                <button
                  onClick={generateQRCode}
                  disabled={!selectedProductData || !!qrData}
                  className="px-6 py-3 bg-cyber-blue text-black font-semibold rounded-lg hover:bg-cyber-blue/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {qrData ? 'QR Code Generated' : 'Generate Payment QR Code'}
                </button>
              </div>
            )}

            {/* QR Code Display */}
            {qrData && qrCodeString && (
              <div className="cyber-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Payment QR Code</h2>
                  {timeRemaining > 0 && (
                    <div className="flex items-center gap-2 text-cyber-blue">
                      <Clock className="w-5 h-5" />
                      <span className="font-mono">{formatTimeRemaining(timeRemaining)}</span>
                    </div>
                  )}
                </div>

                {timeRemaining === 0 && (
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm">
                      This QR code has expired. Generate a new one to continue.
                    </p>
                  </div>
                )}

                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white p-6 rounded-lg">
                    <QRCode
                      value={qrCodeString}
                      size={280}
                      showLabel={false}
                    />
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-gray-400 text-sm">
                      Product: <span className="text-white font-semibold">{qrData.productName}</span>
                    </p>
                    <p className="text-gray-400 text-sm">
                      Amount: <span className="text-white font-semibold">
                        ${formatUnits(BigInt(qrData.amount), 6)} USD
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-4">
                      Have the customer scan this QR code to receive payment
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setQrData(null)
                      setError(null)
                    }}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
                  >
                    Clear QR Code
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
