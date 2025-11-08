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
  const [isCheckingPermission, setIsCheckingPermission] = useState(true)
  const [retryKey, setRetryKey] = useState(0) // Key to force re-initialization
  const containerId = 'qr-scanner-container'

  // Check camera permission status
  const checkCameraPermission = async (): Promise<{ hasPermission: boolean; error?: string }> => {
    try {
      // First, check if permissions API is available
      if ('permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
          if (permissionStatus.state === 'granted') {
            return { hasPermission: true }
          }
          if (permissionStatus.state === 'denied') {
            return { hasPermission: false, error: 'Camera permission is denied in browser settings' }
          }
          // 'prompt' state means we need to ask, which we'll do with getUserMedia
        } catch (permApiError) {
          // Permissions API might not support 'camera' name, fall through to getUserMedia
          console.log('Permissions API check failed, using getUserMedia fallback')
        }
      }

      // Fallback: try to access camera directly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
        return { hasPermission: true }
      } catch (getUserMediaError: any) {
        const errorName = getUserMediaError?.name || ''
        const errorMessage = getUserMediaError?.message || ''
        
        // Check if it's a permission error
        if (
          errorName === 'NotAllowedError' ||
          errorName === 'PermissionDeniedError' ||
          errorName === 'SecurityError' ||
          errorMessage.toLowerCase().includes('permission') ||
          errorMessage.toLowerCase().includes('not allowed') ||
          errorMessage.toLowerCase().includes('denied')
        ) {
          return { 
            hasPermission: false, 
            error: 'Camera permission denied. Please allow camera access in your browser settings.' 
          }
        }
        
        // Camera not found
        if (
          errorName === 'NotFoundError' ||
          errorName === 'DevicesNotFoundError' ||
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('no camera')
        ) {
          return { 
            hasPermission: false, 
            error: 'No camera found. Please ensure a camera is connected.' 
          }
        }
        
        // Camera already in use or other errors - still allow to try
        return { hasPermission: true }
      }
    } catch (err) {
      console.error('Error checking camera permission:', err)
      // On error, assume permission might be available and let scanner try
      return { hasPermission: true }
    }
  }

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

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasPermission(false)
        setIsCheckingPermission(false)
        setError('Camera is not supported in this browser. Please use a modern browser.')
        if (onError) {
          onError('Camera not supported')
        }
        return
      }

      setIsCheckingPermission(true)

      try {
        // Check camera permission first
        const permissionCheck = await checkCameraPermission()
        
        if (!mounted) return

        if (!permissionCheck.hasPermission) {
          setHasPermission(false)
          setIsCheckingPermission(false)
          setError(permissionCheck.error || 'Camera permission denied. Please enable camera access in your browser settings.')
          if (onError) {
            onError(permissionCheck.error || 'Camera permission denied')
          }
          return
        }

        setHasPermission(true)
        setIsCheckingPermission(false)

        // Dynamically import html5-qrcode
        const { Html5Qrcode } = await import('html5-qrcode')

        if (!mounted) return

        const html5QrCode = new Html5Qrcode(containerId)

        // Try to start with back camera first, fallback to any camera
        let started = false
        const cameraConfigs = [
          { facingMode: 'environment' }, // Back camera
          { facingMode: 'user' }, // Front camera
          true, // Any available camera
        ]

        for (const config of cameraConfigs) {
          if (!mounted) return
          try {
            await html5QrCode.start(
              config as string | MediaTrackConstraints,
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
            started = true
            break
          } catch (startError: any) {
            // If this isn't the last config, try the next one
            if (config !== cameraConfigs[cameraConfigs.length - 1]) {
              continue
            }
            // If it's the last config and it failed, throw the error
            throw startError
          }
        }

        if (!started) {
          throw new Error('Failed to start camera with any available configuration')
        }
        
        // Only set ref and running state after successful start
        scannerRef.current = html5QrCode
        isRunningRef.current = true
        setScanning(true)
        setError(null)
      } catch (err: any) {
        if (!mounted) return
        setIsCheckingPermission(false)
        
        const errorName = err?.name || ''
        const errorMessage = err?.message || ''
        
        // Check if it's a permission error
        if (
          errorName === 'NotAllowedError' ||
          errorName === 'PermissionDeniedError' ||
          errorMessage.toLowerCase().includes('permission') ||
          errorMessage.toLowerCase().includes('not allowed')
        ) {
          setHasPermission(false)
          setError('Camera permission denied. Please enable camera access in your browser settings and refresh the page.')
          if (onError) {
            onError('Camera permission denied')
          }
        } else if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('no camera')) {
          setHasPermission(false)
          setError('No camera found. Please ensure a camera is connected and try again.')
          if (onError) {
            onError('No camera found')
          }
        } else {
          // Other errors - might still have permission but something else went wrong
          setHasPermission(true)
          setError(`Camera error: ${errorMessage}. Please try refreshing the page.`)
          if (onError) {
            onError(errorMessage)
          }
        }
        
        // Don't set scannerRef if initialization failed
        scannerRef.current = null
        isRunningRef.current = false
      }
    }

    startScanning()

    return () => {
      mounted = false
      if (scannerRef.current) {
        stopScanner(scannerRef.current, true)
        scannerRef.current = null
      }
      isRunningRef.current = false
    }
  }, [fps, onScanSuccess, onError, retryKey])

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
        {isCheckingPermission && (
          <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="text-white text-lg font-semibold">Checking camera access...</p>
          </div>
        )}

        {!isCheckingPermission && hasPermission === false && (
          <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500" />
            <p className="text-white text-lg font-semibold">Camera Access Required</p>
            <p className="text-gray-400 max-w-md">
              {error || 'Please allow camera access to scan QR codes. Check your browser settings and refresh the page.'}
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={async () => {
                  // Stop any existing scanner
                  if (scannerRef.current) {
                    try {
                      if (isRunningRef.current) {
                        await scannerRef.current.stop().catch(() => {})
                      }
                      await scannerRef.current.clear().catch(() => {})
                    } catch (err) {
                      // Ignore errors
                    }
                    scannerRef.current = null
                    isRunningRef.current = false
                  }
                  
                  // Reset states
                  setError(null)
                  setScanning(false)
                  setIsCheckingPermission(true)
                  setHasPermission(null)
                  
                  // Force re-initialization by incrementing retry key
                  setRetryKey(prev => prev + 1)
                }}
                className="px-4 py-2 bg-cyber-blue text-white rounded-lg hover:bg-cyber-blue/80 transition"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  window.location.reload()
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}

        {!isCheckingPermission && hasPermission === true && (
          <>
            <div id={containerId} className="w-full h-full max-w-md" />
            {error && (
              <div className="absolute top-4 left-4 right-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">{error}</p>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 flex justify-center pointer-events-none top-24">
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
