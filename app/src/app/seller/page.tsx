'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { QRCode } from '@/components/QRCode'
import { useInvisibleWallet } from '@/providers/InvisibleWalletProvider'
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider'
import { supabaseClient } from '@/lib/supabaseClient'
import { fetchAllProducts, type ContractProduct } from '@/lib/contractReader'
import { formatUnits } from 'viem'
import { Clock, AlertCircle, CheckCircle2, X } from 'lucide-react'

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

interface PaymentSession {
  id: string
  session_id: string
  seller_wallet_address: string
  product_id: number | null
  product_name: string | null
  amount: string
  status: 'pending' | 'paid' | 'expired'
  created_at: string
  expires_at: string
  payment_tx_hash: string | null
  buyer_address: string | null
  payment_method: string | null
  notified_at: string | null
}

export default function SellerPage() {
  const { isReady, primaryAccount } = useInvisibleWallet()
  const { user } = useSupabaseAuth()
  const [products, setProducts] = useState<ProductDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [qrData, setQrData] = useState<PaymentQRData | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [creatingSession, setCreatingSession] = useState(false)
  const [paymentReceived, setPaymentReceived] = useState<PaymentSession | null>(null)
  const [sessionStatus, setSessionStatus] = useState<'pending' | 'paid' | 'expired'>('pending')
  const subscriptionRef = useRef<any>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentSessionIdRef = useRef<string | null>(null)

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

  // Generate QR code data and create database record
  const generateQRCode = async () => {
    if (!isReady || !primaryAccount || selectedProduct === null) {
      setError('Please select a product and ensure your wallet is ready')
      return
    }

    const product = products[selectedProduct]
    if (!product) {
      setError('Selected product not found')
      return
    }

    if (!user) {
      setError('Please sign in to generate payment QR codes')
      return
    }

    setCreatingSession(true)
    setError(null)

    try {
      const sessionId = generateSessionId()
      const expiresAt = getExpirationTime()
      const expiresAtISO = new Date(expiresAt).toISOString()

      // Create database record for the payment session
      const { error: dbError } = await supabaseClient
        .from('qr_payment_sessions')
        .insert({
          session_id: sessionId,
          seller_wallet_address: primaryAccount.address,
          product_id: product.id,
          product_name: product.name,
          amount: product.priceUSD,
          status: 'pending',
          expires_at: expiresAtISO,
        })

      if (dbError) {
        console.error('Error creating payment session:', dbError)
        setError('Failed to create payment session. Please try again.')
        setCreatingSession(false)
        return
      }

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
      setSessionStatus('pending')
      setPaymentReceived(null)

      // Immediately check if payment was already received (edge case)
      const { data: existingSession } = await supabaseClient
        .from('qr_payment_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (existingSession) {
        const session = existingSession as PaymentSession
        if (session.status === 'paid') {
          setSessionStatus('paid')
          setPaymentReceived(session)
          setError(null)
        } else {
          // Set up real-time subscription to monitor payment status
          setupPaymentSubscription(sessionId)
        }
      } else {
        // Set up real-time subscription to monitor payment status
        setupPaymentSubscription(sessionId)
      }
    } catch (err) {
      console.error('Error generating QR code:', err)
      setError('Failed to generate QR code. Please try again.')
    } finally {
      setCreatingSession(false)
    }
  }

  // Set up real-time subscription to monitor payment status
  const setupPaymentSubscription = useCallback((sessionId: string) => {
    console.log('Setting up payment subscription for session:', sessionId)
    
    // Store current session ID
    currentSessionIdRef.current = sessionId
    
    // Clean up existing subscription and polling
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    // Subscribe to changes for this specific session
    subscriptionRef.current = supabaseClient
      .channel(`qr-payment-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'qr_payment_sessions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('📡 Real-time update received:', payload)
          const updatedSession = payload.new as PaymentSession
          console.log('Payment session updated via real-time:', updatedSession)
          
          if (updatedSession.status === 'paid') {
            console.log('✅ Payment received! Updating UI...')
            setSessionStatus('paid')
            setPaymentReceived(updatedSession)
            setError(null)
            // Stop polling when paid
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
          } else if (updatedSession.status === 'expired') {
            setSessionStatus('expired')
            setQrData(null)
            // Stop polling when expired
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to payment updates for session:', sessionId)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Subscription error - falling back to polling only')
        }
      })

    // Also poll for updates as a fallback (every 2 seconds for faster response)
    console.log('🔄 Starting polling for session:', sessionId)
    pollIntervalRef.current = setInterval(async () => {
      try {
        console.log('🔍 Polling for session status:', sessionId)
        const { data, error } = await supabaseClient
          .from('qr_payment_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .single()

        if (error) {
          console.error('❌ Error fetching session status:', error)
          return
        }

        if (data) {
          const session = data as PaymentSession
          console.log('📊 Current session status:', session.status, 'for session:', sessionId)
          
          if (session.status === 'paid') {
            console.log('✅ Payment found via polling! Updating UI...')
            setSessionStatus('paid')
            setPaymentReceived(session)
            setError(null)
            // Stop polling when paid
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
          } else if (session.status === 'expired') {
            console.log('⏰ Session expired')
            setSessionStatus('expired')
            setQrData(null)
            // Stop polling when expired
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
          }
        } else {
          console.log('⚠️ No session data found for:', sessionId)
        }
      } catch (err) {
        console.error('❌ Error polling session status:', err)
      }
    }, 2000) // Poll every 2 seconds instead of 3 for faster response
  }, [])

  // Re-setup subscription when qrData.sessionId changes (only if not already set up)
  useEffect(() => {
    if (qrData?.sessionId && sessionStatus === 'pending') {
      // Only set up if we don't already have a subscription for this session
      if (currentSessionIdRef.current !== qrData.sessionId) {
        console.log('🔧 Setting up subscription for new session:', qrData.sessionId)
        setupPaymentSubscription(qrData.sessionId)
      } else {
        console.log('✅ Subscription already active for session:', qrData.sessionId)
      }
    }

    // Cleanup subscription and polling on unmount or when QR data is cleared
    return () => {
      if (!qrData) {
        if (subscriptionRef.current) {
          console.log('🧹 Cleaning up subscription (QR data cleared)')
          subscriptionRef.current.unsubscribe()
          subscriptionRef.current = null
        }
        if (pollIntervalRef.current) {
          console.log('🧹 Cleaning up polling interval (QR data cleared)')
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        currentSessionIdRef.current = null
      }
    }
  }, [qrData?.sessionId, sessionStatus, setupPaymentSubscription])

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
                  disabled={!selectedProductData || !!qrData || creatingSession}
                  className="px-6 py-3 bg-cyber-blue text-black font-semibold rounded-lg hover:bg-cyber-blue/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingSession
                    ? 'Creating Session...'
                    : qrData
                    ? 'QR Code Generated'
                    : 'Generate Payment QR Code'}
                </button>
              </div>
            )}

            {/* Payment Received Alert */}
            {paymentReceived && sessionStatus === 'paid' && (
              <div className="bg-green-500/20 border-2 border-green-500/50 rounded-lg p-6 space-y-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                    <div>
                      <h3 className="text-xl font-bold text-green-400">Payment Received! 🎉</h3>
                      <p className="text-green-300 text-sm">Your payment has been successfully processed</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPaymentReceived(null)
                      setQrData(null)
                      setSessionStatus('pending')
                    }}
                    className="p-2 hover:bg-green-500/20 rounded-full transition"
                  >
                    <X className="w-5 h-5 text-green-400" />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Product:</span>
                    <span className="text-white font-semibold">{paymentReceived.product_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white font-semibold">
                      ${formatUnits(BigInt(paymentReceived.amount), 6)} USD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Method:</span>
                    <span className="text-white font-semibold">{paymentReceived.payment_method}</span>
                  </div>
                  {paymentReceived.payment_tx_hash && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Transaction:</span>
                      <a
                        href={`https://testnet.snowtrace.io/tx/${paymentReceived.payment_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyber-blue hover:underline text-xs font-mono"
                      >
                        {paymentReceived.payment_tx_hash.slice(0, 8)}...{paymentReceived.payment_tx_hash.slice(-6)}
                      </a>
                    </div>
                  )}
                  {paymentReceived.buyer_address && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">From:</span>
                      <span className="text-white font-mono text-xs">
                        {paymentReceived.buyer_address.slice(0, 6)}...{paymentReceived.buyer_address.slice(-4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* QR Code Display */}
            {qrData && qrCodeString && sessionStatus !== 'paid' && (
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

                {sessionStatus === 'pending' && timeRemaining > 0 && (
                  <div className="bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-cyber-blue">
                        <div className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse" />
                        <p className="text-sm font-semibold">Waiting for payment...</p>
                      </div>
                      <button
                        onClick={async () => {
                          if (qrData?.sessionId) {
                            console.log('🔄 Manually checking payment status for:', qrData.sessionId)
                            try {
                              const { data, error } = await supabaseClient
                                .from('qr_payment_sessions')
                                .select('*')
                                .eq('session_id', qrData.sessionId)
                                .single()

                              if (error) {
                                console.error('Error fetching session:', error)
                                return
                              }

                              if (data) {
                                const session = data as PaymentSession
                                console.log('📊 Manual check - Session status:', session.status)
                                if (session.status === 'paid') {
                                  setSessionStatus('paid')
                                  setPaymentReceived(session)
                                  setError(null)
                                } else if (session.status === 'expired') {
                                  setSessionStatus('expired')
                                  setQrData(null)
                                }
                              }
                            } catch (err) {
                              console.error('Error manually checking status:', err)
                            }
                          }
                        }}
                        className="text-xs text-cyber-blue hover:text-cyber-blue/80 underline"
                      >
                        Check Status
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Session ID: {qrData?.sessionId?.slice(0, 20)}...
                    </p>
                  </div>
                )}

                {(timeRemaining === 0 || sessionStatus === 'expired') && (
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
                      setPaymentReceived(null)
                      setSessionStatus('pending')
                      if (subscriptionRef.current) {
                        subscriptionRef.current.unsubscribe()
                        subscriptionRef.current = null
                      }
                      if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current)
                        pollIntervalRef.current = null
                      }
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
