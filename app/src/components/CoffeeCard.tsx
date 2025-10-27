'use client'

// Coffee shop or reward item card

interface CoffeeCardProps {
  name: string
  location: string
  reward?: string
  icon?: string
}

export function CoffeeCard({ 
  name, 
  location, 
  reward = '+10 $BREWFI',
  icon = '☕' 
}: CoffeeCardProps) {
  return (
    <div className="cyber-card p-6 hover:scale-105 transition-transform cursor-pointer">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <p className="text-sm text-gray-400 mb-4">{location}</p>
      <div className="flex items-center justify-between">
        <span className="text-cyber-green text-sm">✓ Verified</span>
        <span className="text-cyber-blue text-sm">{reward}</span>
      </div>
    </div>
  )
}

