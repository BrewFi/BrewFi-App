'use client'

import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'

// DApp Home page - Connect wallet and enter app

export default function DAppHome() {
  return (
    <main className="min-h-screen flex flex-col pb-28">
      <Navbar />
      
      {/* Hero Section - Split Layout */}
      <div className="flex-1 flex flex-col justify-center px-8 py-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-8">
          
          {/* Left Side - Text Content */}
          <div className="space-y-4">
            <h1 className="text-6xl lg:text-7xl font-bold">
              <span className="neon-text">☕ BrewFi</span>
            </h1>
            
            <p className="text-3xl text-cyan-400 coffee-glow font-semibold">
              Drink. Earn. Connect.
            </p>
            
            <p className="text-gray-400 text-lg lg:text-xl leading-relaxed">
              The first decentralized coffee loyalty platform on Avalanche. 
              Earn $BREWFI tokens with every purchase and redeem across all participating shops.
            </p>
          </div>
          
          {/* Right Side - Coin Animation */}
          <div className="flex items-center justify-center h-[40vh] lg:h-[50vh]">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-contain"
            >
              <source src="/video/coinanimation.MP4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
        
        {/* Stats Section - Moved Up */}
        <div className="grid grid-cols-3 gap-4 lg:gap-8 mt-auto">
          <div className="cyber-card p-4 lg:p-6">
            <div className="text-2xl lg:text-3xl font-bold text-cyber-blue">404</div>
            <div className="text-gray-400 text-xs lg:text-base">Active Users</div>
          </div>
          <a href="/dapp/community" className="block">
            <button className="cyber-card p-4 lg:p-6 w-full hover:scale-105 hover:shadow-lg hover:shadow-cyber-blue/20 transition-all cursor-pointer">
              <div className="text-2xl lg:text-3xl font-bold text-cyber-blue">9</div>
              <div className="text-gray-400 text-xs lg:text-base">Coffee Shops</div>
            </button>
          </a>
          <div className="cyber-card p-4 lg:p-6">
            <div className="text-2xl lg:text-3xl font-bold text-cyber-pink">25K+</div>
            <div className="text-gray-400 text-xs lg:text-base">$BREWFI Earned</div>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </main>
  )
}

