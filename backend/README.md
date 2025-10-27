# CoffeeChain Backend API 🔌

Node.js backend server with TypeScript that handles API requests, database operations, and Avalanche blockchain interactions for the CoffeeChain platform.

## 🛠️ Tech Stack

- **Express** or **Fastify** - Web framework
- **TypeScript** - Type-safe Node.js
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Production database (or SQLite for dev)
- **Ethers.js** / **Viem** - Avalanche blockchain interaction

## 📦 Installation

```bash
# Install dependencies
npm install

# or using pnpm
pnpm install
```

## 🚀 Running Locally

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

The API will be available at **http://localhost:4000**

## 🔧 Environment Variables

Create a `.env` file in the `backend/` directory (see `.env.example`):

```env
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/coffeechain"
# or for dev: "file:./dev.db"

# Avalanche
AVALANCHE_RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"
PRIVATE_KEY="0x..."
CONTRACT_ADDRESS="0x..."

# API
JWT_SECRET="your-secret-key"
CORS_ORIGIN="http://localhost:3000"
```

## 🗄️ Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio (DB GUI)
npx prisma studio
```

## 📁 Project Structure

```
src/
├── server.ts                    # Express/Fastify entry point
├── routes/
│   ├── index.ts                # Main API routes
│   └── users.ts                # User endpoints
├── services/
│   └── avalanche.service.ts    # Blockchain interactions
└── prisma/
    └── schema.prisma           # Database schema
```

## 🌐 API Endpoints

### Users
- `GET /api/users/:address` - Get user by wallet address
- `POST /api/users` - Create new user

### Rewards
- `GET /api/rewards/:address` - Get user rewards balance
- `POST /api/rewards/claim` - Claim pending rewards

### Coffee Shops
- `GET /api/shops` - List registered coffee shops
- `POST /api/shops` - Register new shop (admin)

## 🔗 Avalanche Integration

The backend communicates with:
- **$BREWFI Token Contract** - ERC-20 token on Avalanche C-Chain
- **Rewards Contract** - Manages loyalty points and redemptions
- **Coffee Shop Registry** - On-chain shop verification

## 📝 Development Notes

This is a hackathon demo API. For production use, add:
- Authentication & authorization (JWT)
- Rate limiting
- Request validation (Zod)
- Comprehensive error handling
- API documentation (Swagger/OpenAPI)
- Logging (Winston/Pino)

