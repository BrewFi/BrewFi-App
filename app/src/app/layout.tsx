import type { Metadata } from 'next'
import '../styles/globals.css'
import { SupabaseAuthProvider } from '@/providers/SupabaseAuthProvider'
import { InvisibleWalletProvider } from '@/providers/InvisibleWalletProvider'


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
        <SupabaseAuthProvider>
          <InvisibleWalletProvider>
            {children}
          </InvisibleWalletProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  )
}
