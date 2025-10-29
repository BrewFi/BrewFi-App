'use client'

import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import { WalletConnect } from './WalletConnect'
import Image from 'next/image'

// Navigation bar component

export function Navbar() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isDappHome = pathname === '/dapp/home'
  const isDappSettings = pathname === '/dapp/settings'
  const isDappFlowPage = pathname === '/dapp/buy' || pathname === '/dapp/swap' || pathname === '/dapp/send' || pathname === '/dapp/receive'

  return (
    <nav className="flex justify-between items-center p-6 border-b border-cyber-blue/30">
      <div className="flex items-center space-x-8">
        <div className="flex items-center gap-3">
          <Image 
            src="/images/brewficoin.png" 
            alt="BrewFi Coin" 
            width={40} 
            height={40}
            className="rounded-full"
          />
          <h1 className="text-2xl font-bold neon-text">BrewFi</h1>
        </div>
      </div>
      
      <div className="flex gap-4 items-center">
        {!isHomePage && <WalletConnect />}
        
        {/* Settings Button for all dapp pages */}
        {!isHomePage && (
          <a href="/dapp/settings">
            <button className="px-4 py-2 border-2 border-gray-400 text-gray-400 font-bold rounded-lg hover:bg-gray-400 hover:text-black transition-all flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </a>
        )}
        
        {/* Buy Coffee Now - hide on /dapp/home, /dapp/settings, and flow pages */}
        {!isDappHome && !isDappSettings && !isDappFlowPage && (
          <a href="/dapp/home">
            <button className="px-6 py-2 border-2 border-cyber-pink text-cyber-pink font-bold rounded-lg hover:bg-cyber-pink hover:text-black transition-all">
              Buy Coffee Now
            </button>
          </a>
        )}
      </div>
    </nav>
  )
}

