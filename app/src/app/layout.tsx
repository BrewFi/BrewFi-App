import type { Metadata } from 'next'
import '../styles/globals.css'
import { Web3Provider } from '@/providers/Web3Provider';


export const metadata: Metadata = {
  title: 'BrewFi | Web3 Loyalty Rewards',
  description: 'Earn $BREWFI tokens with every coffee purchase on Avalanche',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  )
}


