'use client'

import { Navbar } from '@/components/Navbar'

// Landing page - Connect wallet and enter app

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      {/* Hero Section - Split Layout */}
      <div className="px-8 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Side - Text Content */}
          <div className="space-y-4 lg:space-y-6">
            <h1 className="text-6xl lg:text-8xl font-bold neon-text">
              BrewFi
            </h1>
            
            <p className="text-3xl lg:text-4xl text-cyan-400 coffee-glow font-semibold">
              Drink. Earn. Connect.
            </p>
            
            <p className="text-gray-400 text-lg lg:text-2xl leading-relaxed">
              The first decentralized coffee loyalty platform on Avalanche. 
              Earn $BREWFI tokens with every purchase and redeem across all participating shops.
            </p>
          </div>
          
          {/* Right Side - Coin Animation */}
          <div className="flex items-center justify-center h-[300px] lg:h-[400px]">
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
      </div>
      
      {/* Stats Section */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-4 lg:gap-8">
          <div className="cyber-card p-4 lg:p-6">
            <div className="text-2xl lg:text-3xl font-bold text-cyber-green">199</div>
            <div className="text-gray-400 text-sm lg:text-base">Active Users</div>
          </div>
          <div className="cyber-card p-4 lg:p-6">
            <div className="text-2xl lg:text-3xl font-bold text-cyber-blue">10</div>
            <div className="text-gray-400 text-sm lg:text-base">Coffee Shops</div>
          </div>
          <div className="cyber-card p-4 lg:p-6">
            <div className="text-2xl lg:text-3xl font-bold text-cyber-pink">5K+</div>
            <div className="text-gray-400 text-sm lg:text-base">$BREWFI Earned</div>
          </div>
        </div>
      </div>
    </main>
  )
}


