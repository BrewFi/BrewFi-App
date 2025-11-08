'use client'

import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import Image from 'next/image'
import { formatUnits } from 'viem'
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider'
import { useInvisibleWallet } from '@/providers/InvisibleWalletProvider'
import { BREWFI_CONTRACT } from '@/config/contracts'

// Navigation bar component

export function Navbar() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isDappHome = pathname === '/home'
  const isDappSettings = pathname === '/settings'
  const isDappFlowPage = pathname === '/buy' || pathname === '/send' || pathname === '/receive'
  
  const { user } = useSupabaseAuth()
  const { primaryAccount, isReady } = useInvisibleWallet()

  // Extract username from email (part before @)
  const username = user?.email ? user.email.split('@')[0] : null
  
  // Slice wallet address (first 6 chars + ... + last 4 chars)
  const getSlicedAddress = (address: string | undefined) => {
    if (!address) return null
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  const slicedAddress = getSlicedAddress(primaryAccount?.address)

  // Get BrewFi balance
  const brewfiBalance = primaryAccount?.tokenBalances[BREWFI_CONTRACT.address]
  const formattedBalance = brewfiBalance !== undefined 
    ? parseFloat(formatUnits(brewfiBalance, 18)).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    : '0'

  return (
    <nav className="flex justify-between items-center p-4 md:p-6 border-b border-cyber-blue/30">
      <div className="flex items-center space-x-6 md:space-x-8">
        <a href="/" className="flex items-center">
          <span 
            aria-label="BrewFi Logo"
            className="logo-cyber-green h-10 md:h-12 w-[140px] md:w-[180px]"
          />
        </a>
      </div>
      
      <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-end max-w-full">
        {/* BrewFi Coin Balance - show when wallet is ready */}
        {isReady && user && (
          <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-lg border border-cyber-green/40 shadow-lg shadow-cyber-green/20 hover:shadow-cyber-green/30 transition-all duration-300 group">
            <div className="relative">
              <Image
                src="/images/brewficoingreen.png"
                alt="BrewFi Coin"
                width={24}
                height={24}
                className="w-5 h-5 md:w-6 md:h-6 animate-pulse-slow group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"
              />
              <div className="absolute inset-0 bg-cyber-green/30 rounded-full blur-sm group-hover:blur-md group-hover:bg-cyber-green/50 transition-all duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wider leading-none">
                BREWFI
              </span>
              <span className="text-base md:text-lg font-bold text-cyber-green leading-tight neon-text">
                {formattedBalance}
              </span>
            </div>
          </div>
        )}
        
        {/* User info - show when logged in */}
        {user && (
          <div className="flex items-center gap-3 text-sm md:text-base">
            {username && (
              <span className="text-cyber-green font-semibold hidden sm:inline">
                {username}
              </span>
            )}
            {slicedAddress && (
              <span className="text-gray-400 font-mono px-2 py-1 bg-gray-800/50 rounded border border-gray-700">
                {slicedAddress}
              </span>
            )}
          </div>
        )}
        
        {/* Settings Button for all dapp pages */}
        {!isHomePage && (
          <a href="/settings" className="hidden sm:block">
            <button className="px-3 py-2 md:px-4 border-2 border-gray-400 text-gray-400 font-bold rounded-lg hover:bg-gray-400 hover:text-black transition-all flex items-center gap-2 text-sm md:text-base">
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:inline">Settings</span>
            </button>
          </a>
        )}
        
        {/* Buy Coffee Now - show on all sizes except on /home, /settings, and flow pages */}
        {!isDappHome && !isDappSettings && !isDappFlowPage && (
          <a href="/home" className="block">
            <button className="px-4 md:px-6 py-2 border-2 border-cyber-pink text-cyber-pink font-bold rounded-lg hover:bg-cyber-pink hover:text-black transition-all text-sm md:text-base">
              Buy Coffee Now
            </button>
          </a>
        )}
      </div>
    </nav>
  )
}
