'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { User, Bell, Shield, Wallet, Globe, Moon, Coins, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { useInvisibleWallet } from '@/providers/InvisibleWalletProvider'
import { USDT_CONTRACT } from '@/config/contracts'
import { encodeFunctionData, formatUnits, parseUnits } from 'viem'
import { createContractReader } from '@/lib/contractReader'

// Settings page - User preferences and configuration

export default function DAppSettings() {
  const { hydrated, isReady, primaryAccount, callContract, refresh } = useInvisibleWallet()
  const [minting, setMinting] = useState(false)
  const [mintStatus, setMintStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [mintTxHash, setMintTxHash] = useState<string | null>(null)
  const [mintError, setMintError] = useState<string | null>(null)
  
  // Fixed amount: 10 USDT (10 * 10^6 = 10000000)
  const MINT_AMOUNT = parseUnits('10', 6)

  return (
    <div className="min-h-screen pb-28">
      <Navbar />
      <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h2 className="text-4xl font-bold mb-4 text-cyber-blue">Settings</h2>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* Account Settings */}
        <div className="cyber-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-cyber-blue" />
            <h3 className="text-xl font-bold">Account</h3>
          </div>
          <div className="space-y-3 pl-9">
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium">Profile Information</div>
              <div className="text-sm text-gray-400">Update your personal details</div>
            </button>
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium">Email & Password</div>
              <div className="text-sm text-gray-400">Change your login credentials</div>
            </button>
          </div>
        </div>

        {/* Invisible Wallet Status */}
        <div className="cyber-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-cyber-blue" />
            <h3 className="text-xl font-bold">Invisible Wallet</h3>
          </div>
          <div className="space-y-3 pl-9 text-sm text-gray-300">
            <p>
              Status: {hydrated ? (isReady ? 'Active' : 'Pending setup') : 'Loading...'}
            </p>
            <p>
              Once active, your seed phrase is securely stored in Supabase and
              transactions are handled by the custodial wallet.
            </p>
          </div>
        </div>

        {/* Wallet Settings */}
        <div className="cyber-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-cyber-blue" />
            <h3 className="text-xl font-bold">Wallet</h3>
          </div>
          <div className="space-y-3 pl-9">
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium">Connected Wallets</div>
              <div className="text-sm text-gray-400">Manage your connected wallets</div>
            </button>
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium">Transaction History</div>
              <div className="text-sm text-gray-400">View your past transactions</div>
            </button>
          </div>
        </div>

        {/* Test Tokens */}
        <div className="cyber-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Coins className="w-6 h-6 text-cyber-blue" />
            <h3 className="text-xl font-bold">Test Tokens</h3>
          </div>
          <div className="space-y-4 pl-9">
            <div className="space-y-2">
              <p className="text-sm text-gray-300">Get 10 USDT test tokens for testing on Fuji testnet</p>
            </div>
            
            <div className="space-y-3">
              {primaryAccount && (
                <div className="bg-black/50 border border-cyber-blue/30 rounded-lg p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Your USDT Balance:</span>
                    <span className="font-semibold text-cyber-blue">
                      {formatUnits(
                        primaryAccount.tokenBalances[USDT_CONTRACT.address] ?? 0n,
                        6
                      )} USDT
                    </span>
                  </div>
                </div>
              )}

              {mintStatus === 'success' && mintTxHash && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">Tokens minted successfully! 🎉</span>
                  </div>
                  <div className="mt-2">
                    <a
                      href={`https://testnet.snowtrace.io/tx/${mintTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyber-blue hover:underline flex items-center gap-1"
                    >
                      View transaction
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {mintStatus === 'error' && mintError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-red-400 font-semibold">Mint Failed</div>
                      <div className="text-red-300 text-xs mt-1">{mintError}</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={async () => {
                  if (!isReady || !primaryAccount) {
                    return
                  }

                  setMinting(true)
                  setMintStatus('idle')
                  setMintError(null)
                  setMintTxHash(null)

                  try {
                    // Encode the mint function call
                    // Note: The USDT contract's mint function only takes amount
                    // and mints to msg.sender (the caller's address)
                    // Fixed amount: 10 USDT
                    const mintData = encodeFunctionData({
                      abi: USDT_CONTRACT.abi,
                      functionName: 'mint',
                      args: [MINT_AMOUNT],
                    })

                    // Call the mint function
                    const result = await callContract({
                      to: USDT_CONTRACT.address,
                      data: mintData,
                    })

                    setMintTxHash(result.hash)
                    setMintStatus('success')

                    // Wait for transaction confirmation and refresh balance
                    setTimeout(async () => {
                      try {
                        const client = createContractReader()
                        // Wait for transaction to be confirmed
                        await client.waitForTransactionReceipt({
                          hash: result.hash as `0x${string}`,
                          timeout: 30_000, // 30 seconds timeout
                        })
                        // Wait a bit more for balance to update on-chain
                        await new Promise((resolve) => setTimeout(resolve, 2000))
                        // Refresh balance
                        await refresh()
                      } catch (err) {
                        console.error('Error waiting for transaction confirmation:', err)
                        // Still try to refresh even if wait fails
                        setTimeout(async () => {
                          await refresh()
                        }, 5000)
                      }
                    }, 1000)
                  } catch (err) {
                    setMintStatus('error')
                    setMintError(
                      err instanceof Error ? err.message : 'Failed to mint tokens'
                    )
                  } finally {
                    setMinting(false)
                  }
                }}
                disabled={minting || !isReady || !primaryAccount}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  minting || !isReady || !primaryAccount
                    ? 'bg-gray-600/50 border border-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-cyber-blue text-black hover:bg-cyber-blue/90 hover:shadow-lg hover:shadow-cyber-blue/50 hover:scale-[1.02]'
                }`}
              >
                {minting && <Loader2 className="w-5 h-5 animate-spin" />}
                {minting ? 'Minting...' : 'Get 10 USDT for test'}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="cyber-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-cyber-blue" />
            <h3 className="text-xl font-bold">Notifications</h3>
          </div>
          <div className="space-y-3 pl-9">
            <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-gray-400">Receive alerts on your device</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-blue"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-gray-400">Get updates via email</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-blue"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="cyber-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-cyber-blue" />
            <h3 className="text-xl font-bold">Privacy & Security</h3>
          </div>
          <div className="space-y-3 pl-9">
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-gray-400">Add extra security to your account</div>
            </button>
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium">Privacy Settings</div>
              <div className="text-sm text-gray-400">Control who can see your activity</div>
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="cyber-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Moon className="w-6 h-6 text-cyber-blue" />
            <h3 className="text-xl font-bold">Preferences</h3>
          </div>
          <div className="space-y-3 pl-9">
            <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div>
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-gray-400">Toggle dark theme</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-blue"></div>
              </label>
            </div>
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Language
              </div>
              <div className="text-sm text-gray-400">English (US)</div>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="cyber-card p-6 border-red-500/20">
          <h3 className="text-xl font-bold text-red-500 mb-4">Danger Zone</h3>
          <div className="space-y-3">
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-red-500/10 transition-all border border-red-500/20">
              <div className="font-medium text-red-500">Disconnect Wallet</div>
              <div className="text-sm text-gray-400">Remove all connected wallets</div>
            </button>
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-red-500/10 transition-all border border-red-500/20">
              <div className="font-medium text-red-500">Delete Account</div>
              <div className="text-sm text-gray-400">Permanently delete your account and data</div>
            </button>
          </div>
        </div>

      </div>
      </div>
      <BottomNav />
    </div>
  )
}
