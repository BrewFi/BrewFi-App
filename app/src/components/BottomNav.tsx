'use client'

import { ShoppingBag, ArrowLeftRight, Send, Download } from 'lucide-react'
import { useState } from 'react'

// Sticky Bottom Navigation Bar with Glassmorphism Design

export function BottomNav() {
  const [activeButton, setActiveButton] = useState('buy')

  const navItems = [
    { id: 'buy', label: 'Buy', icon: ShoppingBag },
    { id: 'swap', label: 'Swap', icon: ArrowLeftRight },
    { id: 'send', label: 'Send', icon: Send },
    { id: 'receive', label: 'Receive', icon: Download },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-50 pb-safe">
      {/* Container with max-width for desktop */}
      <div className="w-full px-4 pb-4">
        {/* Glassmorphism Background */}
        <div className="relative rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl p-2 mx-auto max-w-2xl">
          {/* Gradient overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-cyber-blue/5 to-transparent pointer-events-none" />
          
          {/* Navigation Buttons */}
          <div className="relative grid grid-cols-4 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeButton === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveButton(item.id)}
                  className={`
                    relative flex flex-col items-center justify-center py-3 px-2 rounded-xl
                    transition-all duration-300 ease-out
                    ${isActive 
                      ? 'bg-gradient-to-t from-cyber-blue/30 to-cyber-blue/10 shadow-lg shadow-cyber-blue/20' 
                      : 'hover:bg-white/5 active:scale-95'
                    }
                  `}
                >
                  {/* Active indicator glow */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-cyber-blue/20 blur-xl -z-10" />
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
    </nav>
  )
}

