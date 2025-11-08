'use client'

import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { useInvisibleWallet } from '@/providers/InvisibleWalletProvider'
import { formatUnits } from 'viem'
import { USDC_CONTRACT, BREWFI_CONTRACT } from '@/config/contracts'

// DApp Dashboard - Invisible wallet overview

export default function DAppDashboard() {
  const { isReady, loading, primaryAccount, refresh } = useInvisibleWallet()

  const avaxBalance = primaryAccount ? formatUnits(primaryAccount.balanceWei, 18) : '0.0'
  const usdcBalance = primaryAccount?.tokenBalances[USDC_CONTRACT.address]
  const brewfiBalance = primaryAccount?.tokenBalances[BREWFI_CONTRACT.address]

  return (
    <div className="min-h-screen pb-28">
      <Navbar />
      <div className="p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="cyber-card p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Invisible Wallet</h2>
              <p className="text-sm text-gray-400">
                Custodial wallet managed via Supabase and the Tether Wallet Developer Kit.
              </p>
            </div>

            <div className="flex flex-col gap-2 text-sm text-gray-300">
              <span>Status: {isReady ? 'Ready' : loading ? 'Loading…' : 'Pending setup'}</span>
              <span className="break-all">
                Address: {primaryAccount?.address ?? '—'}
              </span>
            </div>

            <div>
              <button
                onClick={refresh}
                disabled={!isReady}
                className="px-4 py-2 rounded-lg border border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/10 transition disabled:opacity-50"
              >
                Refresh Balances
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BalanceCard label="AVAX" value={avaxBalance} highlight="text-cyber-blue" />
            <BalanceCard
              label="USDC"
              value={usdcBalance !== undefined ? formatUnits(usdcBalance, 6) : '0.0'}
              highlight="text-emerald-400"
            />
            <BalanceCard
              label="$BREWFI"
              value={brewfiBalance !== undefined ? formatUnits(brewfiBalance, 18) : '0.0'}
              highlight="text-cyber-pink"
            />
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

function BalanceCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight: string
}) {
  return (
    <div className="cyber-card p-6 space-y-2">
      <div className="text-xs uppercase tracking-[0.3em] text-gray-500">{label}</div>
      <div className={`text-3xl font-bold ${highlight}`}>{value}</div>
    </div>
  )
}
