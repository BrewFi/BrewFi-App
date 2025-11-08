'use client'

import { useEffect, useRef, useState } from 'react'
import { X, AlertCircle } from 'lucide-react'

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
  onError?: (error: string) => void
  onClose?: () => void
  fps?: number
}

export function QRScanner({ 
  onScanSuccess, 
  onError,
  onClose,
  fps = 10
}: QRScannerProps) {
  const scannerRef = useRef<any>(null)
  const isRunningRef = useRef<boolean>(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const containerId = 'qr-scanner-container'

  useEffect(() => {
    let mounted = true

    const stopScanner = async (scanner: any, force: boolean = false) => {
      if (!scanner) {
        return
      }

      // If force is false, only stop if we think it's running
      if (!force && !isRunningRef.current) {
        return
      }

      try {
        // Check if scanner has a getState method to verify it's running
        if (typeof scanner.getState === 'function') {
          const state = scanner.getState()
          // Html5Qrcode states: 0 = UNKNOWN, 1 = SCANNING, 2 = NOT_STARTED, 3 = PAUSED
          // Only stop if scanner is actually running (1) or paused (3)
          if (state === 1 || state === 3) {
            await scanner.stop()
          }
        } else {
          // Fallback: try to stop, but catch the error if it's not running
          await scanner.stop()
        }
        isRunningRef.current = false
      } catch (err: any) {
        // Ignore errors about scanner not running or paused
        const errorMessage = (err?.message || '').toLowerCase()
        if (
          !errorMessage.includes('not running') &&
          !errorMessage.includes('not paused') &&
          !errorMessage.includes('cannot stop') &&
          !errorMessage.includes('scanner is not running')
        ) {
          // Only log unexpected errors
          console.error('Error stopping scanner:', err)
        }
        isRunningRef.current = false
      }

      try {
        await scanner.clear()
      } catch (err) {
        // Ignore clear errors - they're not critical
      }
    }

    const startScanning = async () => {
      // Only run on client side
      if (typeof window === 'undefined') {
        return
      }

      try {
        // Dynamically import html5-qrcode
        const { Html5Qrcode } = await import('html5-qrcode')

        // Check for camera permission
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          stream.getTracks().forEach(track => track.stop())
          setHasPermission(true)
        } catch (permError) {
          setHasPermission(false)
          setError('Camera permission denied. Please enable camera access in your browser settings.')
          if (onError) {
            onError('Camera permission denied')
          }
          return
        }

        if (!mounted) return

        const html5QrCode = new Html5Qrcode(containerId)

        await html5QrCode.start(
          { facingMode: 'environment' }, // Use back camera on mobile
          {
            fps: fps,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            // Success callback - stop scanner after successful scan
            setScanning(false)
            // Stop the scanner (force stop since we know it was running)
            await stopScanner(html5QrCode, true)
            onScanSuccess(decodedText)
          },
          (errorMessage) => {
            // Error callback - ignore common scanning errors
            if (errorMessage !== 'NotFoundException: No MultiFormat Readers were able to detect the code in the image.') {
              // Only show non-common errors
            }
          }
        )
        
        // Only set ref and running state after successful start
        scannerRef.current = html5QrCode
        isRunningRef.current = true
        setScanning(true)
        setError(null)
      } catch (err) {
        if (!mounted) return
        const errorMessage = err instanceof Error ? err.message : 'Failed to start scanner'
        setError(errorMessage)
        setHasPermission(false)
        // Don't set scannerRef if initialization failed
        scannerRef.current = null
        isRunningRef.current = false
        if (onError) {
          onError(errorMessage)
        }
      }
    }

    startScanning()

    return () => {
      mounted = false
      if (scannerRef.current) {
        stopScanner(scannerRef.current)
        scannerRef.current = null
      }
      isRunningRef.current = false
    }
  }, [fps, onScanSuccess, onError])

  const handleStop = async () => {
    if (!scannerRef.current) {
      setScanning(false)
      if (onClose) {
        onClose()
      }
      return
    }

    const scanner = scannerRef.current
    scannerRef.current = null

    // Stop the scanner with proper error handling
    if (!isRunningRef.current) {
      setScanning(false)
      if (onClose) {
        onClose()
      }
      return
    }

    try {
      // Check if scanner has a getState method to verify it's running
      if (typeof scanner.getState === 'function') {
        const state = scanner.getState()
        // Only stop if scanner is actually running (1) or paused (3)
        if (state === 1 || state === 3) {
          await scanner.stop()
        }
      } else {
        // Fallback: try to stop, but catch the error if it's not running
        await scanner.stop()
      }
      isRunningRef.current = false
    } catch (err: any) {
      // Ignore errors about scanner not running or paused
      const errorMessage = (err?.message || '').toLowerCase()
      if (
        !errorMessage.includes('not running') &&
        !errorMessage.includes('not paused') &&
        !errorMessage.includes('cannot stop') &&
        !errorMessage.includes('scanner is not running')
      ) {
        // Only log unexpected errors
        console.error('Error stopping scanner:', err)
      }
      isRunningRef.current = false
    }

    try {
      await scanner.clear()
    } catch (err) {
      // Ignore clear errors
    }

    setScanning(false)
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Scan QR Code</h2>
        <button
          onClick={handleStop}
          className="p-2 rounded-full hover:bg-white/10 transition"
          aria-label="Close scanner"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Scanner Container */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {hasPermission === false && (
          <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500" />
            <p className="text-white text-lg font-semibold">Camera Access Required</p>
            <p className="text-gray-400 max-w-md">
              {error || 'Please allow camera access to scan QR codes. Check your browser settings and refresh the page.'}
            </p>
          </div>
        )}

        {hasPermission === true && (
          <>
            <div id={containerId} className="w-full h-full max-w-md" />
            {error && (
              <div className="absolute top-4 left-4 right-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">{error}</p>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-cyber-blue rounded-lg w-64 h-64 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-black/80 backdrop-blur-sm border-t border-white/10 text-center">
        <p className="text-gray-400 text-sm">
          Position the QR code within the frame
        </p>
      </div>
    </div>
  )
}
