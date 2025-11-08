import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'
import { SupabaseAuthProvider } from '@/providers/SupabaseAuthProvider'
import { InvisibleWalletProvider } from '@/providers/InvisibleWalletProvider'
import { InstallPrompt } from '@/components/InstallPrompt'


export const metadata: Metadata = {
  title: 'BrewFi | Web3 Loyalty Rewards',
  description: 'Earn $BREWFI tokens with every coffee purchase on Avalanche',
  manifest: '/manifest.json',
  applicationName: 'BrewFi',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BrewFi',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/logo/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo/BREWFI_2_GREEN.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/logo/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#019a59',
    'msapplication-tap-highlight': 'no',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#019a59',
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
            <InstallPrompt />
          </InvisibleWalletProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  )
}
