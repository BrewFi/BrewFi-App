import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'CoffeeChain | Web3 Loyalty Rewards',
  description: 'Earn $BREWFI tokens with every coffee purchase on Avalanche',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="cyber-grid min-h-screen">
        {children}
      </body>
    </html>
  )
}


