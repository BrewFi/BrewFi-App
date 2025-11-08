'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeProps {
  value: string
  size?: number
  level?: 'L' | 'M' | 'Q' | 'H'
  showLabel?: boolean
  label?: string
}

// QR Code display component with actual QR generation
export function QRCode({ 
  value, 
  size = 256, 
  level = 'M',
  showLabel = true,
  label = 'Scan at any participating shop'
}: QRCodeProps) {
  if (!value) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-48 h-48 bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-gray-500 text-sm">No data</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-4 rounded-lg">
        <QRCodeSVG
          value={value}
          size={size}
          level={level}
          includeMargin={true}
        />
      </div>
      {showLabel && label && (
        <p className="text-sm text-gray-400 text-center max-w-xs">{label}</p>
      )}
    </div>
  )
}
