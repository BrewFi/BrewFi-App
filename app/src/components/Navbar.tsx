'use client'

import { usePathname } from 'next/navigation'
import { WalletConnect } from './WalletConnect'

// Navigation bar component

export function Navbar() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  return (
    <nav className="flex justify-between items-center p-6 border-b border-cyber-blue/30">
      <div className="flex items-center space-x-8">
        <h1 className="text-2xl font-bold neon-text">☕ BrewFi</h1>
      </div>
      
      <div className="flex gap-4 items-center">
        {!isHomePage && <WalletConnect />}
        <a href="/dapp/home">
          <button className="px-6 py-2 border-2 border-cyber-pink text-cyber-pink font-bold rounded-lg hover:bg-cyber-pink hover:text-black transition-all">
            Buy Coffee Now
          </button>
        </a>
      </div>
    </nav>
  )
}

