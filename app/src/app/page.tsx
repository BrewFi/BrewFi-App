'use client'

// Landing page - Connect wallet and enter app

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Hero Section */}
      <div className="text-center space-y-8 max-w-4xl">
        <h1 className="text-7xl font-bold">
          <span className="neon-text">☕ CoffeeChain</span>
        </h1>
        
        <p className="text-2xl text-cyan-400 coffee-glow">
          Drink. Earn. Connect.
        </p>
        
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          The first decentralized coffee loyalty platform on Avalanche.
          Earn $BREWFI tokens with every purchase and redeem across all participating shops.
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center pt-8">
          <button className="px-8 py-4 bg-cyber-blue text-black font-bold rounded-lg hover:animate-glow transition-all">
            Connect Wallet
          </button>
          
          <button className="px-8 py-4 border-2 border-cyber-pink text-cyber-pink font-bold rounded-lg hover:bg-cyber-pink hover:text-black transition-all">
            Try Demo
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 pt-16">
          <div className="cyber-card p-6">
            <div className="text-3xl font-bold text-cyber-green">1,337</div>
            <div className="text-gray-400">Active Users</div>
          </div>
          <div className="cyber-card p-6">
            <div className="text-3xl font-bold text-cyber-blue">42</div>
            <div className="text-gray-400">Coffee Shops</div>
          </div>
          <div className="cyber-card p-6">
            <div className="text-3xl font-bold text-cyber-pink">25K+</div>
            <div className="text-gray-400">$BREWFI Earned</div>
          </div>
        </div>
      </div>
    </main>
  )
}


