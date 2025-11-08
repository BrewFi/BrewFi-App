'use client'

import { Coffee, ArrowLeftRight, Send, Download, QrCode } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

// Sticky Bottom Navigation Bar with Glassmorphism Design

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { id: 'buy', label: 'Buy', icon: Coffee, path: '/dapp/buy' },
    { id: 'swap', label: 'Swap', icon: ArrowLeftRight, path: '/dapp/swap' },
    { id: 'send', label: 'Send', icon: Send, path: '/dapp/send' },
    { id: 'receive', label: 'Receive', icon: Download, path: '/dapp/receive' },
  ]

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const isQRActive = pathname === '/dapp/qr-pay'

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-50 pb-safe">
      {/* Container with full width */}
      <div className="w-full px-4 pb-4">
        {/* Glassmorphism Background */}
        <div className="relative rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl p-2 mx-auto w-full">
          {/* Gradient overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-cyber-blue/5 to-transparent pointer-events-none" />
          
          {/* Navigation Buttons with Center QR Button */}
          <div className="relative flex items-center justify-between px-1">
            {/* Left side - Buy and Swap */}
            <div className="flex gap-2 flex-1">
              {navItems.slice(0, 2).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.path
                const isBuy = item.id === 'buy'
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      relative flex flex-col items-center justify-center py-3 px-2 rounded-xl flex-1
                      transition-all duration-300 ease-out
                      ${isActive && isBuy
                        ? 'bg-gradient-to-t from-red-500/30 to-red-500/10 shadow-lg shadow-red-500/20' 
                        : isActive 
                        ? 'bg-gradient-to-t from-cyber-blue/30 to-cyber-blue/10 shadow-lg shadow-cyber-blue/20' 
                        : 'hover:bg-white/5 active:scale-95'
                      }
                    `}
                  >
                    {/* Active indicator glow */}
                    {isActive && (
                      <div className={`absolute inset-0 rounded-xl blur-xl -z-10 ${isBuy ? 'bg-red-500/20' : 'bg-cyber-blue/20'}`} />
                    )}
                    
                    {/* Icon */}
                    <Icon 
                      className={`
                        w-6 h-6 mb-1 transition-all duration-300
                        ${isActive && isBuy
                          ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                          : isActive 
                          ? 'text-cyber-blue drop-shadow-[0_0_8px_rgba(0,230,255,0.6)]' 
                          : 'text-gray-400'
                        }
                      `}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    
                    {/* Label */}
                    <span 
                      className={`
                        text-xs font-medium transition-all duration-300
                        ${isActive && isBuy
                          ? 'text-red-500'
                          : isActive 
                          ? 'text-cyber-blue' 
                          : 'text-gray-400'
                        }
                      `}
                    >
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Center QR Button - Circular */}
            <div className="relative mx-2">
              <button
                onClick={() => handleNavigation('/dapp/qr-pay')}
                className={`
                  relative w-14 h-14 rounded-full flex items-center justify-center
                  transition-all duration-300 ease-out transform
                  ${isQRActive
                    ? 'bg-gradient-to-br from-cyber-blue to-cyber-blue/80 shadow-2xl shadow-cyber-blue/50 scale-110'
                    : 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 shadow-lg hover:scale-105 active:scale-95'
                  }
                  border-2 ${isQRActive ? 'border-cyber-blue' : 'border-gray-600'}
                `}
              >
                {/* Glow effect when active */}
                {isQRActive && (
                  <div className="absolute inset-0 rounded-full bg-cyber-blue/30 blur-xl -z-10 animate-pulse" />
                )}
                
                {/* QR Icon */}
                <QrCode 
                  className={`
                    w-7 h-7 transition-all duration-300
                    ${isQRActive
                      ? 'text-white drop-shadow-[0_0_12px_rgba(0,230,255,0.8)]'
                      : 'text-gray-300'
                    }
                  `}
                  strokeWidth={isQRActive ? 2.5 : 2}
                />
              </button>
            </div>

            {/* Right side - Send and Receive */}
            <div className="flex gap-2 flex-1">
              {navItems.slice(2, 4).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.path
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      relative flex flex-col items-center justify-center py-3 px-2 rounded-xl flex-1
                      transition-all duration-300 ease-out
                      ${isActive
                        ? 'bg-gradient-to-t from-cyber-blue/30 to-cyber-blue/10 shadow-lg shadow-cyber-blue/20' 
                        : 'hover:bg-white/5 active:scale-95'
                      }
                    `}
                  >
                    {/* Active indicator glow */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl blur-xl -z-10 bg-cyber-blue/20" />
                    )}
                    
                    {/* Icon */}
                    <Icon 
                      className={`
                        w-6 h-6 mb-1 transition-all duration-300
                        ${isActive
                          ? 'text-cyber-blue drop-shadow-[0_0_8px_rgba(0,230,255,0.6)]' 
                          : 'text-gray-400'
                        }
                      `}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    
                    {/* Label */}
                    <span 
                      className={`
                        text-xs font-medium transition-all duration-300
                        ${isActive
                          ? 'text-cyber-blue' 
                          : 'text-gray-400'
                        }
                      `}
                    >
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
