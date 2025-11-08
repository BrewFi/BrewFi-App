'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if user dismissed recently (within last week)
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      // If dismissed within the last week, don't show
      if (dismissedTime > oneWeekAgo) {
        return
      }
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true)
      setIsInstalled(true)
      return
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Check if already installed (for iOS)
    if (iOS && (window.navigator as any).standalone) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Show iOS install instructions after a delay
    let timer: NodeJS.Timeout | null = null
    if (iOS) {
      timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000) // Show after 3 seconds
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setShowPrompt(false)
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Store dismissal in localStorage to avoid showing again for a week
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isInstalled || !showPrompt) {
    return null
  }

  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-cyber-green/50 rounded-lg shadow-2xl p-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-cyber-green" />
                <h3 className="text-white font-bold text-sm">Install BrewFi App</h3>
              </div>
              <p className="text-gray-300 text-xs mb-3">
                Add BrewFi to your home screen for quick access and a better experience!
              </p>
              <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
                <li>Tap the share button <span className="text-cyber-green">↗</span> at the bottom</li>
                <li>Scroll down and tap <span className="text-cyber-green">"Add to Home Screen"</span></li>
                <li>Tap <span className="text-cyber-green">"Add"</span> in the top right</li>
              </ol>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Android/Chrome install prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-cyber-green/50 rounded-lg shadow-2xl p-4 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-cyber-green" />
              <h3 className="text-white font-bold text-sm">Install BrewFi App</h3>
            </div>
            <p className="text-gray-300 text-xs mb-3">
              Install BrewFi for quick access, offline support, and a better mobile experience!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-cyber-green hover:bg-cyber-green/90 text-black font-bold py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install Now
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 border border-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}
