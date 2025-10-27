# CoffeeChain Frontend 🎨

Next.js 14 application with TypeScript, Tailwind CSS, and Web3 wallet integration for interacting with the CoffeeChain loyalty platform.

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Wagmi** - React hooks for Ethereum
- **RainbowKit** - Wallet connection UI
- **Viem** - TypeScript interface for Ethereum

## 📦 Installation

```bash
# Install dependencies
npm install

# or using pnpm
pnpm install
```

## 🚀 Running Locally

```bash
# Development server
npm run dev

# Production build
npm run build
npm start
```

The app will be available at **http://localhost:3000**

## 🔧 Environment Variables

Create a `.env.local` file in the `app/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_AVALANCHE_RPC=https://api.avax-test.network/ext/bc/C/rpc
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── page.tsx      # Home page
│   ├── dashboard/    # Dashboard page
│   └── layout.tsx    # Root layout
├── components/       # React components
│   ├── WalletConnect.tsx
│   └── QRCode.tsx
└── lib/              # Utilities and configs
    └── wagmi.ts      # Web3 configuration
```

## 🌐 Key Features

- **Wallet Connection** - Connect to MetaMask, Core, and other wallets
- **Dashboard** - View $BREWFI balance and rewards
- **QR Code Generation** - For in-store coffee shop redemptions
- **Avalanche Integration** - Native support for AVAX C-Chain

## 📝 Development Notes

This is a hackathon demo frontend. For production use, add:
- Error boundaries
- Loading states
- Comprehensive testing
- Analytics integration

