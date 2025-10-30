'use client'

import { useMemo, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { Modal } from '@/components/ui/Modal'
import { Coffee, ArrowLeft, Check, Plus, Minus } from 'lucide-react'
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { PURCHASE_CONTRACT, USDC_CONTRACT } from '@/config/contracts'
import BuyWithUSDC from '@/components/blockchain/BuyWithUSDC'

// Mock coffee shop data
const coffeeShops = [
  { id: 1, name: 'Brew Haven', location: 'Downtown', address: '0xA1B2C3D4E5F6...' },
  { id: 2, name: 'The Coffee Lab', location: 'Midtown', address: '0xF6E5D4C3B2A1...' },
  { id: 3, name: 'Espresso Express', location: 'Uptown', address: '0x1234567890AB...' },
  { id: 4, name: 'Java Junction', location: 'West Side', address: '0xABCDEF123456...' },
]

// Static fallback items (used only if contract call isn't available)
const fallbackCoffeeItems = [
  { id: 1, name: 'Coffee', price: 2.50, emoji: '☕' },
  { id: 2, name: 'Espresso', price: 3.00, emoji: '☕' },
  { id: 3, name: 'Cappuccino', price: 4.00, emoji: '🥤' },
  { id: 4, name: 'Americano', price: 3.50, emoji: '☕' },
  { id: 5, name: 'Mocha', price: 4.50, emoji: '🍫' },
]

type Screen = 'select' | 'menu' | 'amount' | 'success'

interface OrderItem {
  id: number
  name: string
  price: number
  quantity: number
}

export default function BuyPage() {
  const [screen, setScreen] = useState<Screen>('select')
  const [selectedShop, setSelectedShop] = useState<typeof coffeeShops[0] | null>(null)
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()

  // Fetch products from contract and show only active ones
  const { data: productsData } = useReadContract({
    address: PURCHASE_CONTRACT.address,
    abi: PURCHASE_CONTRACT.abi,
    functionName: 'getAllProducts'
  })

  // User USDC balance
  const { data: usdcBalanceData } = useReadContract({
    address: USDC_CONTRACT.address,
    abi: USDC_CONTRACT.abi,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000']
  })

  // Allowance for PURCHASE_CONTRACT
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: USDC_CONTRACT.address,
    abi: USDC_CONTRACT.abi,
    functionName: 'allowance',
    args: address ? [address, PURCHASE_CONTRACT.address] : undefined
  })

  // Map contract products -> UI coffee items, filter active
  const coffeeItems = useMemo(() => {
    const raw = Array.isArray(productsData) ? productsData : []

    // Keep original index from on-chain array as productId
    const activeWithIndex = raw
      .map((p: any, index: number) => ({ ...p, __index: index }))
      .filter((p: any) => p && p.active)

    // priceUSD comes with 6 decimals (USDC). Convert to dollars.
    const mapped = activeWithIndex.map((p: any) => ({
      id: p.__index, // use the original index as the productId
      name: typeof p.name === 'string' ? p.name : String(p.name),
      price: Number(p.priceUSD) / 1_000_000,
      priceUSDRaw: p.priceUSD?.toString?.() ?? String(p.priceUSD),
      rewardRatioRaw: p.rewardRatio?.toString?.() ?? String(p.rewardRatio),
      emoji: '☕'
    }))

    // If no on-chain products, use fallback (ids are local-only in this case)
    return mapped.length > 0 ? mapped : fallbackCoffeeItems
  }, [productsData])

  const hasOnchainProducts = useMemo(() => {
    return Array.isArray(productsData) && coffeeItems.length > 0 && 'priceUSDRaw' in coffeeItems[0]
  }, [productsData, coffeeItems])

  const usdcBalanceDollars = useMemo(() => {
    const raw = usdcBalanceData as any
    const asStr = raw?.toString?.() ?? '0'
    const num = Number(asStr)
    if (!Number.isFinite(num)) return 0
    return num / 1_000_000
  }, [usdcBalanceData])

  const handleShopSelect = (shop: typeof coffeeShops[0]) => {
    setSelectedShop(shop)
    setScreen('menu')
  }

  const handleCoffeeSelect = (coffee: typeof coffeeItems[0]) => {
    const currentTotal = getTotalAmount()
    const nextTotal = currentTotal + coffee.price
    if (nextTotal > usdcBalanceDollars) {
      return
    }
    setOrderItems(prev => {
      const existing = prev.find(item => item.id === coffee.id)
      if (existing) {
        return prev.map(item => 
          item.id === coffee.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...coffee, quantity: 1 }]
    })
  }

  const handleQuantityChange = (coffeeId: number, delta: number) => {
    setOrderItems(prev => {
      const target = prev.find(i => i.id === coffeeId)
      if (!target) return prev
      const proposedQty = Math.max(0, target.quantity + delta)
      // If increasing, ensure affordability
      if (delta > 0) {
        const currentTotal = getTotalAmount()
        const extraUnits = proposedQty - target.quantity
        const nextTotal = currentTotal + target.price * extraUnits
        if (nextTotal > usdcBalanceDollars) {
          return prev
        }
      }
      const updated = prev.map(item => 
        item.id === coffeeId 
          ? { ...item, quantity: proposedQty }
          : item
      )
      return updated.filter(item => item.quantity > 0)
    })
  }

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getTotalAmountUSDRaw = () => {
    // Sum of priceUSDRaw (1e6) * quantity as BigInt; only valid when on-chain products are loaded
    try {
      let total = 0n
      for (const item of orderItems) {
        const raw = BigInt((item as any).priceUSDRaw ?? '0')
        total += raw * BigInt(item.quantity)
      }
      return total
    } catch {
      return 0n
    }
  }

  const handleConfirmPurchase = async () => {
    if (!address || orderItems.length === 0) return
    if (!hasOnchainProducts) return
    try {
      setIsProcessing(true)

      // Compute total required USDC (1e6)
      const totalUSDC = getTotalAmountUSDRaw()

      // Ensure allowance
      const currentAllowance = BigInt((allowanceData as any)?.toString?.() ?? '0')
      if (currentAllowance < totalUSDC) {
        const approveHash = await writeContractAsync({
          address: USDC_CONTRACT.address,
          abi: USDC_CONTRACT.abi,
          functionName: 'approve',
          args: [PURCHASE_CONTRACT.address, totalUSDC]
        })
        if (publicClient && approveHash) {
          await publicClient.waitForTransactionReceipt({ hash: approveHash as `0x${string}` })
        }
        await refetchAllowance()
      }

      // Build the productIds list repeated by quantity
      const productIds: number[] = []
      orderItems.forEach(item => {
        for (let i = 0; i < item.quantity; i++) productIds.push(item.id)
      })

      // Sequentially execute purchases
      for (const pid of productIds) {
        const txHash = await writeContractAsync({
          address: PURCHASE_CONTRACT.address,
          abi: PURCHASE_CONTRACT.abi,
          functionName: 'purchaseWithUSDC',
          args: [BigInt(pid)]
        })
        if (publicClient && txHash) {
          await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })
        }
      }

      setScreen('success')
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCloseSuccess = () => {
    setScreen('select')
    setSelectedShop(null)
    setAmount('')
    setOrderItems([])
  }

  const handleBack = () => {
    if (screen === 'menu') {
      setScreen('select')
      setOrderItems([])
    } else if (screen === 'amount') {
      setScreen('menu')
      setAmount('')
    }
  }

  // Calculate on-chain-equivalent BREWFI reward per item
  const calculateBrewfiReward = (priceUSDRaw: string, rewardRatioRaw: string) => {
    try {
      const USD_1E12 = 1_000_000_000_000n // 1e12
      const ONE_18 = 1_000_000_000_000_000_000n // 1e18
      const price = BigInt(priceUSDRaw)
      const ratio = BigInt(rewardRatioRaw)
      // (priceUSD * 1e12 * rewardRatio) / 1e18
      const wei = (price * USD_1E12 * ratio) / ONE_18
      return wei
    } catch {
      return 0n
    }
  }

  const formatTokenAmount = (amountWei: bigint, decimals: number = 18, fractionDigits: number = 2) => {
    const base = 10n ** BigInt(decimals)
    const whole = amountWei / base
    const fraction = amountWei % base
    if (fractionDigits === 0) return whole.toString()
    const fracStr = (fraction + 10n ** BigInt(decimals)).toString().slice(1).padStart(decimals, '0').slice(0, fractionDigits)
    // Trim trailing zeros
    const trimmedFrac = fracStr.replace(/0+$/g, '')
    return trimmedFrac ? `${whole.toString()}.${trimmedFrac}` : whole.toString()
  }

  return (
    <main className="min-h-screen flex flex-col pb-32 bg-black">
      <Navbar />

      <div className="flex-1 px-8 pt-8 pb-6 max-w-7xl mx-auto w-full">
        {/* Select Coffee Shop Screen */}
        {screen === 'select' && (
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-center neon-text mb-8">
              Select Coffee Shop
            </h1>
            
            <div className="space-y-4">
              {coffeeShops.map(shop => (
                <button
                  key={shop.id}
                  onClick={() => handleShopSelect(shop)}
                  className="w-full cyber-card p-6 hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-cyber-blue/20"
                >
                  <div className="flex items-center gap-4">
                    <Coffee className="w-8 h-8 text-cyber-blue" />
                    <div className="flex-1 text-left">
                      <div className="text-xl font-bold text-white">{shop.name}</div>
                      <div className="text-sm text-gray-400">{shop.location}</div>
                    </div>
                    <div className="text-xs text-gray-500">{shop.address}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Coffee Menu Screen */}
        {screen === 'menu' && selectedShop && (
          <div className="space-y-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-cyber-blue hover:brightness-110 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            <div className="text-center space-y-4">
              <div className="text-7xl animate-pulse-slow">☕</div>
              <h1 className="text-4xl lg:text-5xl font-bold neon-text">
                Select Your Coffee
              </h1>
              <p className="text-gray-400 text-xl">at {selectedShop.name}</p>
            </div>

            {/* Coffee Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {coffeeItems.map(coffee => {
                const orderItem = orderItems.find(item => item.id === coffee.id)
                const isSelected = !!orderItem
                const remainingBudget = usdcBalanceDollars - getTotalAmount()
                const canAddOne = remainingBudget >= coffee.price

                return (
                  <div
                    key={coffee.id}
                    className={`cyber-card p-6 transition-all duration-300 relative ${
                      isSelected 
                        ? 'border-cyber-blue bg-cyber-blue/10 shadow-lg shadow-cyber-blue/30' 
                        : 'hover:border-cyber-blue/50 hover:shadow-lg hover:shadow-cyber-blue/20'
                    } ${canAddOne ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed opacity-60'}`}
                    onClick={() => {
                      if (!isSelected && canAddOne) handleCoffeeSelect(coffee)
                    }}
                  >
                    {hasOnchainProducts && (coffee as any).priceUSDRaw && (coffee as any).rewardRatioRaw && (
                      (() => {
                        const rewardWei = calculateBrewfiReward((coffee as any).priceUSDRaw as string, (coffee as any).rewardRatioRaw as string)
                        const rewardDisplay = formatTokenAmount(rewardWei, 18, 2)
                        return (
                          <div className="absolute top-3 right-3">
                            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-cyber-blue to-emerald-400 text-black text-xs font-extrabold shadow-[0_0_15px_rgba(0,245,255,0.4)]">
                              + {rewardDisplay} BREWFI
                            </span>
                          </div>
                        )
                      })()
                    )}
                    <div className="text-center space-y-3">
                      <div className="text-5xl">{coffee.emoji}</div>
                      <h3 className="text-xl font-bold text-white">{coffee.name}</h3>
                      <div className="text-2xl font-bold text-cyber-blue">
                        ${coffee.price.toFixed(2)}
                      </div>
                      {!canAddOne && (
                        <div className="text-xs text-red-400 font-semibold">Insufficient USDC balance</div>
                      )}

                      {hasOnchainProducts && (coffee as any).priceUSDRaw && (
                        <div className="mt-4">
                          {canAddOne ? (
                            <BuyWithUSDC
                              productId={coffee.id as number}
                              priceUSD={(coffee as any).priceUSDRaw as string}
                              onSuccess={() => setScreen('success')}
                            />
                          ) : (
                            <button
                              disabled
                              className="w-full bg-gray-800 text-gray-400 font-bold py-3 rounded-lg border border-gray-700 cursor-not-allowed"
                            >
                              Insufficient USDC
                            </button>
                          )}
                        </div>
                      )}

                      {isSelected && orderItem && (
                        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-cyber-blue/30">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleQuantityChange(coffee.id, -1)
                            }}
                            className="w-10 h-10 rounded-full bg-cyber-blue/20 border border-cyber-blue hover:bg-cyber-blue/30 transition-all flex items-center justify-center"
                          >
                            <Minus className="w-5 h-5 text-cyber-blue" />
                          </button>
                          
                          <div className="text-2xl font-bold text-white min-w-[40px] text-center">
                            {orderItem.quantity}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (canAddOne) handleQuantityChange(coffee.id, 1)
                            }}
                            className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center ${canAddOne ? 'bg-cyber-blue/20 border-cyber-blue hover:bg-cyber-blue/30' : 'bg-gray-800 border-gray-700 cursor-not-allowed'}`}
                          >
                            <Plus className="w-5 h-5 text-cyber-blue" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total Section */}
            {orderItems.length > 0 && (
              <div className="cyber-card p-8 space-y-6 mt-8">
                <div className="text-center space-y-2">
                  <div className="text-gray-400 text-lg">Total Amount (USD)</div>
                  <div className="text-5xl font-bold text-cyber-blue neon-text">
                    ${getTotalAmount().toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={handleConfirmPurchase}
                  disabled={isProcessing}
                  className="w-full bg-cyber-blue text-black font-bold py-4 rounded-lg hover:shadow-lg hover:shadow-cyber-blue/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirm Purchase
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Enter Amount Screen */}
        {screen === 'amount' && selectedShop && (
          <div className="space-y-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-cyber-blue hover:brightness-110 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            <div className="text-center space-y-4">
              <Coffee className="w-20 h-20 text-cyber-blue mx-auto" />
              <h1 className="text-4xl lg:text-5xl font-bold neon-text">
                Enter Amount
              </h1>
              <p className="text-gray-400">at {selectedShop.name}</p>
            </div>

            <div className="cyber-card p-8 space-y-6">
              <div>
                <label className="block text-gray-400 mb-2">Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-2xl text-white focus:border-cyber-blue focus:outline-none"
                />
              </div>

              <button
                onClick={handleConfirmPurchase}
                disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
                className="w-full bg-cyber-blue text-black font-bold py-4 rounded-lg hover:shadow-lg hover:shadow-cyber-blue/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirm Purchase
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      <Modal isOpen={screen === 'success'} onClose={handleCloseSuccess}>
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-cyber-blue/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Check className="w-10 h-10 text-cyber-blue drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-400">Your transaction has been completed</p>
          </div>

          <div className="bg-black/50 rounded-lg p-4 space-y-3 text-left border border-cyber-blue/30">
            <div className="flex justify-between border-b border-cyber-blue/20 pb-2">
              <span className="text-gray-400">Shop:</span>
              <span className="text-cyber-blue font-semibold">{selectedShop?.name}</span>
            </div>
            
            <div className="space-y-2">
              <div className="text-gray-400 text-sm font-semibold">Order Items:</div>
              {orderItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-white font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between border-t border-cyber-blue/20 pt-2">
              <span className="text-gray-400 font-bold">Total:</span>
              <span className="text-cyber-blue font-bold text-xl">${getTotalAmount().toFixed(2)}</span>
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
