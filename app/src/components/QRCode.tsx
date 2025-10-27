'use client'

// QR Code display for voucher redemption

export function QRCode({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-center space-y-4">
      {/* QR Code placeholder - replace with actual QR library */}
      <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
        <div className="text-black font-mono text-xs p-4 text-center break-all">
          {value}
        </div>
      </div>
      <p className="text-sm text-gray-400">Scan at any participating shop</p>
    </div>
  )
}



