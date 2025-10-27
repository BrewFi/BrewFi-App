# CoffeeChain ☕️ - $BREWFI

A decentralized coffee loyalty rewards platform built on Avalanche. CoffeeChain enables coffee shops to reward customers with $BREWFI tokens, creating a transparent and engaging Web3 loyalty ecosystem.

## 🏗️ Multi-Repo Structure

This repository contains **four independent projects** working together:

```
coffeechain/
├── app/         → Next.js frontend (Web3 UI)
├── backend/     → Node.js API server
├── contracts/   → Foundry smart contracts
└── docs/        → Hackathon deliverables
```

Each folder can be developed and run independently.

## 🚀 Quick Start

### Frontend (Next.js)
```bash
cd app
npm install
npm run dev
# Runs on http://localhost:3000
```

### Backend (Node.js API)
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:4000
```

### Smart Contracts (Foundry)
```bash
cd contracts
forge build
forge test
```

## 📚 Documentation

See the README.md in each subfolder for detailed setup instructions:
- **app/README.md** - Frontend setup and configuration
- **backend/README.md** - Backend API and database setup
- **contracts/README.md** - Smart contract development
- **docs/README.md** - Hackathon materials and tokenomics

## 🎯 Built for Avalanche Hackathon

3-day demo showcasing Web3 loyalty rewards on Avalanche C-Chain.

