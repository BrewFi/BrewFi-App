'use client'

import { Modal } from './ui/Modal'
import { QRCode } from './QRCode'

// Modal for redeeming vouchers with QR code

interface RedeemModalProps {
  isOpen: boolean
  onClose: () => void
  voucherId?: string
}

export function RedeemModal({ isOpen, onClose, voucherId = 'BREW-' + Date.now() }: RedeemModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center space-y-6">
        <div className="text-4xl">🎁</div>
        <h2 className="text-2xl font-bold text-cyber-pink">Redeem Voucher</h2>
        
        <QRCode value={voucherId} />
        
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Voucher ID:</p>
          <p className="font-mono text-xs text-cyber-blue">{voucherId}</p>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full px-6 py-3 bg-cyber-pink text-black font-bold rounded-lg hover:bg-cyber-pink/80 transition-all"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

