'use client'

import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'

// Dashboard - User balance, buy coffee, redeem rewards

export default function DAppDashboard() {
  return (
    <div className="min-h-screen pb-28">
      <Navbar />
      <div className="p-4 lg:p-8">

      {/* Balance Card */}
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="cyber-card p-8 text-center">
          <div className="text-gray-400 mb-2">Your Balance</div>
          <div className="text-6xl font-bold text-cyber-blue mb-4">
            250 <span className="text-3xl">$BREWFI</span>
          </div>
          <div className="text-cyan-400">≈ 2.5 Free Coffees</div>
        </div>

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

