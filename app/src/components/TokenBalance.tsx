'use client'

// Display user's $BREWFI token balance

interface TokenBalanceProps {
  balance: number
}

export function TokenBalance({ balance }: TokenBalanceProps) {
  const freeCoffees = (balance / 100).toFixed(1)
  
  return (
    <div className="cyber-card p-8 text-center">
      <div className="text-gray-400 mb-2 text-sm uppercase tracking-wider">
        Your Balance
      </div>
      <div className="text-6xl font-bold text-cyber-green mb-4 animate-pulse-slow">
        {balance} <span className="text-3xl">$BREWFI</span>
      </div>
      <div className="text-cyber-blue">
        ≈ {freeCoffees} Free Coffees
      </div>
    </div>
  )
}

