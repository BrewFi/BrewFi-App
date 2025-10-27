'use client'

// Community page - List of coffee shops accepting $BREWFI

export default function Community() {
  return (
    <div className="min-h-screen p-8">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-12 pb-4 border-b border-cyber-blue/30">
        <h1 className="text-2xl font-bold neon-text">☕ CoffeeChain</h1>
        <button className="px-4 py-2 cyber-border rounded-lg text-sm">
          Connect Wallet
        </button>
      </nav>

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4 text-cyber-blue">Coffee Shops</h2>
        <p className="text-gray-400">Discover participating shops accepting $BREWFI</p>
      </div>

      {/* Shop Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Shop Card 1 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Cyber Cafe</h3>
          <p className="text-sm text-gray-400 mb-4">Downtown District</p>
          <div className="flex items-center justify-between">
            <span className="text-cyber-green text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
        </div>

        {/* Shop Card 2 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Neo Coffee House</h3>
          <p className="text-sm text-gray-400 mb-4">Tech Quarter</p>
          <div className="flex items-center justify-between">
            <span className="text-cyber-green text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
        </div>

        {/* Shop Card 3 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Quantum Brews</h3>
          <p className="text-sm text-gray-400 mb-4">Innovation Hub</p>
          <div className="flex items-center justify-between">
            <span className="text-cyber-green text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
        </div>

        {/* Shop Card 4 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Matrix Roasters</h3>
          <p className="text-sm text-gray-400 mb-4">Blockchain Avenue</p>
          <div className="flex items-center justify-between">
            <span className="text-cyber-green text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
        </div>

        {/* Shop Card 5 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Terminal Espresso</h3>
          <p className="text-sm text-gray-400 mb-4">Dev District</p>
          <div className="flex items-center justify-between">
            <span className="text-cyber-green text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
        </div>

        {/* Shop Card 6 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Node Cafe</h3>
          <p className="text-sm text-gray-400 mb-4">Web3 Plaza</p>
          <div className="flex items-center justify-between">
            <span className="text-cyber-green text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
        </div>
      </div>
    </div>
  )
}

