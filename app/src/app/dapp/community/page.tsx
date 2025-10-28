'use client'

import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'

// Community page - List of coffee shops accepting $BREWFI

export default function DAppCommunity() {
  return (
    <div className="min-h-screen pb-28">
      <Navbar />
      <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4 text-cyber-blue">Coffee Shops in Palermo</h2>
        <p className="text-gray-400">Participating shops in Buenos Aires accepting $BREWFI on Avalanche</p>
      </div>

      {/* Shop Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Shop Card 1 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform cursor-pointer">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Vive Café</h3>
          <p className="text-sm text-gray-400 mb-4">Costa Rica 5722, Palermo</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-cyber-blue text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
          <button className="w-full px-4 py-2 bg-cyber-pink/20 border border-cyber-pink text-cyber-pink rounded-lg text-sm hover:bg-cyber-pink hover:text-black transition-all">
            Pay with AVAX
          </button>
        </div>

        {/* Shop Card 2 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform cursor-pointer">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Cuervo Café</h3>
          <p className="text-sm text-gray-400 mb-4">El Salvador 4580, Palermo</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-cyber-blue text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
          <button className="w-full px-4 py-2 bg-cyber-pink/20 border border-cyber-pink text-cyber-pink rounded-lg text-sm hover:bg-cyber-pink hover:text-black transition-all">
            Pay with AVAX
          </button>
        </div>

        {/* Shop Card 3 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform cursor-pointer">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">PANI Palermo Soho</h3>
          <p className="text-sm text-gray-400 mb-4">El Salvador 4827, Palermo</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-cyber-blue text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
          <button className="w-full px-4 py-2 bg-cyber-pink/20 border border-cyber-pink text-cyber-pink rounded-lg text-sm hover:bg-cyber-pink hover:text-black transition-all">
            Pay with AVAX
          </button>
        </div>

        {/* Shop Card 4 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform cursor-pointer">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Café Registrado</h3>
          <p className="text-sm text-gray-400 mb-4">Costa Rica 5901, Palermo</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-cyber-blue text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
          <button className="w-full px-4 py-2 bg-cyber-pink/20 border border-cyber-pink text-cyber-pink rounded-lg text-sm hover:bg-cyber-pink hover:text-black transition-all">
            Pay with AVAX
          </button>
        </div>

        {/* Shop Card 5 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform cursor-pointer">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Kaldi</h3>
          <p className="text-sm text-gray-400 mb-4">Nicaragua 4604, Palermo</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-cyber-blue text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
          <button className="w-full px-4 py-2 bg-cyber-pink/20 border border-cyber-pink text-cyber-pink rounded-lg text-sm hover:bg-cyber-pink hover:text-black transition-all">
            Pay with AVAX
          </button>
        </div>

        {/* Shop Card 6 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform cursor-pointer">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Cofi Jaus Palermo</h3>
          <p className="text-sm text-gray-400 mb-4">Humboldt 1793, Palermo</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-cyber-blue text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
          <button className="w-full px-4 py-2 bg-cyber-pink/20 border border-cyber-pink text-cyber-pink rounded-lg text-sm hover:bg-cyber-pink hover:text-black transition-all">
            Pay with AVAX
          </button>
        </div>

        {/* Shop Card 7 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform cursor-pointer">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Kajue Café</h3>
          <p className="text-sm text-gray-400 mb-4">Guatemala 4665, Palermo</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-cyber-blue text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
          <button className="w-full px-4 py-2 bg-cyber-pink/20 border border-cyber-pink text-cyber-pink rounded-lg text-sm hover:bg-cyber-pink hover:text-black transition-all">
            Pay with AVAX
          </button>
        </div>

        {/* Shop Card 8 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform cursor-pointer">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Cocu Boulangerie</h3>
          <p className="text-sm text-gray-400 mb-4">Malabia 1510, Palermo</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-cyber-blue text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
          <button className="w-full px-4 py-2 bg-cyber-pink/20 border border-cyber-pink text-cyber-pink rounded-lg text-sm hover:bg-cyber-pink hover:text-black transition-all">
            Pay with AVAX
          </button>
        </div>

        {/* Shop Card 9 */}
        <div className="cyber-card p-6 hover:scale-105 transition-transform cursor-pointer">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Full City Coffee Roasters</h3>
          <p className="text-sm text-gray-400 mb-4">Thames 1535, Palermo</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-cyber-blue text-sm">✓ Verified</span>
            <span className="text-cyber-blue text-sm">+10 $BREWFI</span>
          </div>
          <button className="w-full px-4 py-2 bg-cyber-pink/20 border border-cyber-pink text-cyber-pink rounded-lg text-sm hover:bg-cyber-pink hover:text-black transition-all">
            Pay with AVAX
          </button>
        </div>
      </div>
      </div>
      <BottomNav />
    </div>
  )
}

