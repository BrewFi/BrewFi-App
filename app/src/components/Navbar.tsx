'use client'

import { WalletConnect } from './WalletConnect'

// Navigation bar component

export function Navbar() {
  return (
    <nav className="flex justify-between items-center p-6 border-b border-cyber-blue/30">
      <div className="flex items-center space-x-8">
        <h1 className="text-2xl font-bold neon-text">☕ CoffeeChain</h1>
        
        <div className="hidden md:flex space-x-6">
          <a href="/" className="text-gray-400 hover:text-cyber-blue transition-colors">
            Home
          </a>
          <a href="/dashboard" className="text-gray-400 hover:text-cyber-blue transition-colors">
            Dashboard
          </a>
          <a href="/community" className="text-gray-400 hover:text-cyber-blue transition-colors">
            Community
          </a>
        </div>
      </div>
      
      <WalletConnect />
    </nav>
  )
}

