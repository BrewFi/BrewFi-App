'use client'

// Dashboard - User balance, buy coffee, redeem rewards

export default function Dashboard() {
  return (
    <div className="min-h-screen p-8">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-12 pb-4 border-b border-cyber-blue/30">
        <h1 className="text-2xl font-bold neon-text">☕ CoffeeChain</h1>
        <button className="px-4 py-2 cyber-border rounded-lg text-sm">
          0x1234...5678
        </button>
      </nav>

      {/* Balance Card */}
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="cyber-card p-8 text-center">
          <div className="text-gray-400 mb-2">Your Balance</div>
          <div className="text-6xl font-bold text-cyber-green mb-4">
            250 <span className="text-3xl">$BREWFI</span>
          </div>
          <div className="text-cyber-blue">≈ 2.5 Free Coffees</div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-6">
          <button className="cyber-card p-8 hover:bg-cyber-green/10 transition-all group">
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
              <div className="text-cyber-green">+10 $BREWFI</div>
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
  )
}


