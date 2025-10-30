'use client'

import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { BREWFI_CONTRACT, USDC_CONTRACT, PURCHASE_CONTRACT } from '@/config/contracts'

// Dashboard - User balance, buy coffee, redeem rewards

export default function DAppDashboard() {
  const { address } = useAccount()
  const { data: avaxBalance } = useBalance({ address, query: { enabled: !!address } })
  const { data: usdcBalance } = useReadContract({
    address: USDC_CONTRACT.address,
    abi: USDC_CONTRACT.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })
  const { data: brewfiBalance } = useReadContract({
    address: BREWFI_CONTRACT.address,
    abi: BREWFI_CONTRACT.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Optional: contract treasury balances
  const { data: contractTreasury } = useReadContract({
    address: PURCHASE_CONTRACT.address,
    abi: PURCHASE_CONTRACT.abi,
    functionName: 'getBalances',
  })

  const avaxDisplay = avaxBalance ? (Number(avaxBalance.value) / 1e18).toFixed(4) : '—'
  const usdcDisplay = typeof usdcBalance === 'bigint' ? (Number(usdcBalance) / 1e6).toFixed(2) : '—'
  const brewfiDisplay = typeof brewfiBalance === 'bigint' ? (Number(brewfiBalance) / 1e18).toFixed(4) : '—'

  const contractBrewfi = contractTreasury ? Number((contractTreasury as any).brewfiBalance) / 1e18 : undefined
  const contractUsdc = contractTreasury ? Number((contractTreasury as any).usdcBalance) / 1e6 : undefined
  const contractAvax = contractTreasury ? Number((contractTreasury as any).avaxBalance) / 1e18 : undefined

  return (
    <div className="min-h-screen pb-28">
      <Navbar />
      <div className="p-4 lg:p-8">

      {/* Balance Card */}
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="cyber-card p-8 text-center space-y-4">
          <div className="text-gray-400">Your Balances</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
            <div className="bg-black/40 border border-cyber-blue/20 rounded-lg p-4">
              <div className="text-gray-400 text-sm">AVAX</div>
              <div className="text-2xl font-bold text-cyber-blue">{avaxDisplay}</div>
            </div>
            <div className="bg-black/40 border border-cyber-blue/20 rounded-lg p-4">
              <div className="text-gray-400 text-sm">USDC</div>
              <div className="text-2xl font-bold text-cyber-blue">{usdcDisplay}</div>
            </div>
            <div className="bg-black/40 border border-cyber-blue/20 rounded-lg p-4">
              <div className="text-gray-400 text-sm">$BREWFI</div>
              <div className="text-2xl font-bold text-cyber-blue">{brewfiDisplay}</div>
            </div>
          </div>
          <div className="text-cyan-400 text-sm">Connect wallet to load live balances</div>
        </div>

        {contractTreasury !== undefined && (
          <div className="cyber-card p-6">
            <h3 className="text-xl font-bold mb-4 text-cyber-blue">Contract Treasury</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
              <div className="bg-black/40 border border-cyber-blue/20 rounded-lg p-4">
                <div className="text-gray-400 text-sm">AVAX</div>
                <div className="text-xl font-semibold text-cyber-blue">{contractAvax?.toFixed(4) ?? '—'}</div>
              </div>
              <div className="bg-black/40 border border-cyber-blue/20 rounded-lg p-4">
                <div className="text-gray-400 text-sm">USDC</div>
                <div className="text-xl font-semibold text-cyber-blue">{contractUsdc?.toFixed(2) ?? '—'}</div>
              </div>
              <div className="bg-black/40 border border-cyber-blue/20 rounded-lg p-4">
                <div className="text-gray-400 text-sm">$BREWFI</div>
                <div className="text-xl font-semibold text-cyber-blue">{contractBrewfi?.toFixed(4) ?? '—'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-6">
          <button className="cyber-card p-8 hover:bg-cyber-blue/10 transition-all group">
            <div className="text-5xl mb-4 group-hover:animate-pulse">☕</div>
            <div className="text-xl font-bold">Buy Coffee</div>
            <div className="text-sm text-gray-400">Earn 10 $BREWFI</div>
          </button>

          <button className="cyber-card p-8 hover:bg-cyber-pink/10 transition-all group">
            <div className="text-5xl mb-4 group-hover:animate-pulse">🎁</div>
            <div className="text-xl font-bold">Redeem Voucher</div>
            <div className="text-sm text-gray-400">Costs 100 $BREWFI</div>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="cyber-card p-6">
          <h3 className="text-xl font-bold mb-4 text-cyber-blue">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div>
                <div className="font-semibold">☕ Coffee Purchase</div>
                <div className="text-sm text-gray-400">Cyber Cafe</div>
              </div>
              <div className="text-cyber-blue">+10 $BREWFI</div>
            </div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div>
                <div className="font-semibold">🎁 Voucher Redeemed</div>
                <div className="text-sm text-gray-400">Neo Coffee House</div>
              </div>
              <div className="text-cyber-pink">-100 $BREWFI</div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <BottomNav />
    </div>
  )
}
