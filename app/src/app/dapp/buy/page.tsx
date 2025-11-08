'use client'

import { useEffect, useState, useMemo } from 'react'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import BuyWithUSDC from '@/components/blockchain/BuyWithUSDC'
import BuyWithUSDT from '@/components/blockchain/BuyWithUSDT'
import { useInvisibleWallet } from '@/providers/InvisibleWalletProvider'
import { fetchAllProducts, type ContractProduct } from '@/lib/contractReader'
import { formatUnits } from 'viem'

// Fallback products if contract fails to load
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

type PaymentMethod = 'USDC' | 'USDT'

export default function BuyPage() {
  const { isReady } = useInvisibleWallet()
  const [products, setProducts] = useState<ProductDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('USDC')

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      setError(null)

      try {
        const contractProducts = await fetchAllProducts()
        
        // Map contract products to display format
        const mappedProducts: ProductDisplay[] = contractProducts
          .map((product: ContractProduct, index: number) => ({
            id: index,
            name: product.name,
            priceUSD: product.priceUSD.toString(),
            emoji: getEmojiForProduct(product.name),
            rewardRatio: product.rewardRatio,
            active: product.active,
          }))
          .filter((p) => p.active) // Only show active products

        if (mappedProducts.length > 0) {
          setProducts(mappedProducts)
        } else {
          // Fallback to static products if contract returns empty
          setProducts(
            FALLBACK_PRODUCTS.map((p) => ({ ...p, active: true })),
          )
        }
      } catch (err) {
        console.error('Failed to load products from contract:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to load products',
        )
        // Use fallback products on error
        setProducts(FALLBACK_PRODUCTS.map((p) => ({ ...p, active: true })))
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])


  // Calculate BREWFI reward for display
  const calculateReward = useMemo(() => {
    return (product: ProductDisplay) => {
      if (!product.rewardRatio) return null
      try {
        // Reward = (priceUSD * 1e12 * rewardRatio) / 1e18
        const USD_1E12 = 1_000_000_000_000n
        const ONE_18 = 1_000_000_000_000_000_000n
        const price = BigInt(product.priceUSD)
        const ratio = product.rewardRatio
        const wei = (price * USD_1E12 * ratio) / ONE_18
        return formatUnits(wei, 18)
      } catch {
        return null
      }
    }
  }, [])

  return (
    <main className="min-h-screen flex flex-col pb-32 bg-black">
      <Navbar />

      <div className="flex-1 px-6 pt-12 pb-6 max-w-5xl mx-auto w-full space-y-8">
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-bold neon-text">Buy Coffee</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            {isReady
              ? 'Choose a drink and pay with USDC or USDT from your invisible wallet.'
              : 'Sign in or create an account to unlock the invisible wallet checkout.'}
          </p>
          
          {/* Payment Method Selector */}
          {isReady && (
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
          )}
          
          {error && (
            <p className="text-sm text-yellow-400">
              Note: Using fallback products. {error}
            </p>
          )}
        </header>

        {loading ? (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <article
                key={i}
                className="cyber-card p-6 space-y-4 text-center animate-pulse"
              >
                <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto" />
                <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto" />
                <div className="h-3 bg-gray-700 rounded w-1/3 mx-auto" />
                <div className="h-10 bg-gray-700 rounded" />
              </article>
            ))}
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.map((product) => {
              const reward = calculateReward(product)
              return (
                <article
                  key={product.id}
                  className="cyber-card p-6 space-y-4 text-center"
                >
                  <div className="text-5xl">{product.emoji}</div>
                  <div className="text-xl font-semibold text-white">
                    {product.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    ${formatUnits(BigInt(product.priceUSD), 6)} USD
                  </div>
                  {reward && (
                    <div className="text-xs text-cyber-blue font-semibold">
                      Earn {reward} BREWFI
                    </div>
                  )}
                  {paymentMethod === 'USDC' ? (
                    <BuyWithUSDC
                      productId={product.id}
                      priceUSD={product.priceUSD}
                    />
                  ) : (
                    <BuyWithUSDT
                      productId={product.id}
                      priceUSD={product.priceUSD}
                    />
                  )}
                </article>
              )
            })}
          </section>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
