# BREWFI Token ($BREWFI)

An ERC-20 token on Avalanche Fuji Testnet with batch airdrop functionality and a purchase contract system for buying products with USDC or AVAX and receiving BREWFI token rewards.

## Token Details

- **Name:** BrewFi Token
- **Symbol:** BREWFI
- **Total Supply:** 10,000,000 BREWFI
- **Decimals:** 18
- **Network:** Avalanche Fuji Testnet (Chain ID: 43113)
- **Standard:** ERC-20 (OpenZeppelin)

## Features

- ✅ ERC-20 compliant token
- ✅ Batch airdrop functionality for efficient token distribution
- ✅ Purchase contract for buying products with USDC/AVAX
- ✅ Automatic BREWFI token rewards based on product configuration
- ✅ Chainlink price feed integration for AVAX/USD conversion
- ✅ Access control (only owner can airdrop and manage products)
- ✅ Gas optimized transfers
- ✅ Event emissions for tracking

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Private key with testnet AVAX
- Access to the internet

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install:
- Hardhat (development environment)
- OpenZeppelin Contracts (security-audited token implementation)
- ethers.js (blockchain interaction)
- dotenv (environment variable management)

### 2. Configure Environment

Copy the example environment file and fill in your details:

```bash
cp .env.example .env
```

Edit `.env` and add your private key and API keys:

```env
PRIVATE_KEY=your_private_key_here
AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
SNOWTRACE_API_KEY=your_snowtrace_api_key_here
```

### 3. Get Testnet AVAX

To deploy the contract, you'll need testnet AVAX for gas fees:

1. Visit the Avalanche Faucet: https://faucet.avalanche.network/
2. Connect your wallet (MetaMask or other)
3. Request testnet AVAX
4. Wait for the funds to arrive in your wallet

You need at least 0.1 AVAX on Fuji testnet to cover deployment and airdrop gas fees.

### 4. Add Fuji Testnet to MetaMask (Optional)

If you haven't already, add Avalanche Fuji testnet to your MetaMask:

- **Network Name:** Avalanche Fuji C-Chain
- **RPC URL:** https://api.avax-test.network/ext/bc/C/rpc
- **Chain ID:** 43113
- **Currency Symbol:** AVAX
- **Block Explorer:** https://testnet.snowtrace.io/

## Usage

### Compile the Contract

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

This will run a comprehensive test suite covering:
- Token deployment
- Transfer functionality
- Airdrop functionality (single and batch)
- Access control
- Edge cases

### Test Purchase Contract

```bash
npm run test:purchase
```

This will run tests for the purchase contract system covering:
- Product management
- USDC and AVAX purchases
- Reward calculations
- Edge cases and error handling

### Deploy the Contract

Deploy the token to Avalanche Fuji testnet:

```bash
npm run deploy:fuji
```

The deployment script will:
1. Display your account address and balance
2. Deploy the BREWFI token contract
3. Mint 10,000,000 tokens to your address
4. Save deployment information to `deployments/`
5. Provide the contract address for viewing on Snowtrace

After deployment, you'll see output like:

```
✅ BREWFI Token deployed successfully!
📍 Contract Address: 0x1234567890abcdef...
🔗 View on Snowtrace: https://testnet.snowtrace.io/address/0x1234567890abcdef...
```

### Configure Airdrop Recipients

Edit `airdrop-list.json` to specify recipients and amounts:

```json
{
  "recipients": [
    {
      "address": "0xRecipientAddress1",
      "amount": "1000"
    },
    {
      "address": "0xRecipientAddress2",
      "amount": "5000"
    }
  ]
}
```

**Note:** The `amount` field is in whole tokens (will be multiplied by 10^18 internally).

### Execute Airdrop

Run the airdrop script to distribute tokens:

```bash
npm run airdrop
```

The script will:
1. Load deployment information
2. Read recipient list from `airdrop-list.json`
3. Check your token balance
4. Execute batch airdrop transaction
5. Display transaction details and link

## Purchase Contract System

The purchase contract allows users to buy products with USDC or AVAX and automatically receive BREWFI tokens as rewards.

### Deploy Purchase Contract

Deploy the purchase contract with product configurations:

```bash
npm run deploy:purchase
```

This will:
1. Deploy the `BrewFiPurchase` contract
2. Configure USDC and Chainlink price feed addresses
3. Add initial products from `products-config.json`
4. Save deployment information

### Fund Purchase Contract

Transfer BREWFI tokens to the purchase contract:

```bash
npm run fund:purchase
```

This will:
1. Transfer BREWFI tokens from owner to purchase contract
2. Calculate how many purchases can be made
3. Display contract balances

### Test Purchase Contract

Run comprehensive tests for the purchase system:

```bash
npm run test:purchase
```

Tests cover:
- Product management
- USDC and AVAX purchases
- Reward calculations
- Edge cases and error handling

### Product Configuration

Edit `products-config.json` to define products:

```json
{
  "products": [
    {
      "name": "Coffee",
      "priceUSD": "5000000",
      "rewardRatio": "1000000000000000000"
    }
  ]
}
```

**Configuration Notes:**
- `priceUSD`: Price in USD scaled by 1e6 (USDC precision)
- `rewardRatio`: Reward ratio scaled by 1e18 (BREWFI precision)
- Example: `5000000` = $5.00, `1000000000000000000` = 1.0x reward

### How It Works

1. **USDC Purchase**: User pays exact USD amount, receives equivalent BREWFI tokens
2. **AVAX Purchase**: Contract converts AVAX to USD using Chainlink price feed, distributes BREWFI rewards
3. **Reward Calculation**: `BREWFI Reward = USD Price × Reward Ratio`
4. **Automatic Distribution**: BREWFI tokens are transferred immediately upon successful payment

### Example Transactions

**Coffee Purchase ($5.00, 1.0x reward):**
- Pay: 5 USDC or equivalent AVAX
- Receive: 5 BREWFI tokens

**Premium Coffee ($5.00, 1.5x reward):**
- Pay: 5 USDC or equivalent AVAX  
- Receive: 7.5 BREWFI tokens

## Contract Verification

Verify your contract on Snowtrace for transparency:

1. Go to https://testnet.snowtrace.io/
2. Navigate to your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Enter the compiler details and upload source code

Or use Hardhat's verification plugin (if configured):

```bash
npx hardhat verify --network fuji <CONTRACT_ADDRESS>
```

## Project Structure

```
token-coffe/
├── contracts/
│   ├── BrewFiToken.sol          # ERC-20 token contract
│   ├── BrewFiPurchase.sol       # Purchase contract
│   ├── MockERC20.sol           # Mock ERC20 for testing
│   └── MockPriceFeed.sol       # Mock price feed for testing
├── scripts/
│   ├── deploy.js                 # Token deployment script
│   ├── deployPurchase.js         # Purchase contract deployment
│   ├── fundPurchaseContract.js   # Contract funding script
│   └── airdrop.js                # Batch airdrop script
├── test/
│   ├── BrewFiToken.test.js       # Token tests
│   └── BrewFiPurchase.test.js    # Purchase contract tests
├── deployments/                  # Deployment info (auto-generated)
│   └── latest-deployment.json
├── airdrop-list.json             # Airdrop recipients
├── products-config.json          # Product configurations
├── hardhat.config.js             # Hardhat configuration
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore file
└── README.md                     # This file
```

## Smart Contract Functions

### Public Functions

- `name()` - Returns "BrewFi Token"
- `symbol()` - Returns "BREWFI"
- `decimals()` - Returns 18
- `totalSupply()` - Returns total token supply
- `balanceOf(address)` - Returns balance of an address
- `transfer(to, amount)` - Transfers tokens to an address
- `getTotalSupply()` - Returns supply in human-readable format (10000000)

### Owner-Only Functions

- `airdrop(recipient, amount)` - Airdrop tokens to a single recipient
- `batchAirdrop(recipients[], amounts[])` - Airdrop tokens to multiple recipients

## Purchase Contract Functions

### Public Functions

- `purchaseWithUSDC(productId)` - Purchase product with USDC
- `purchaseWithAVAX(productId)` - Purchase product with AVAX
- 
- `calculateBrewfiReward(priceUSD, rewardRatio)` - Calculate BREWFI reward amount
- `getAvaxUsdPrice()` - Get current AVAX/USD price from Chainlink
- `getProductCount()` - Get total number of products
- `getProduct(productId)` - Get product details
- `getAllProducts()` - Get all products
- `getBalances()` - Get contract token balances

### Owner-Only Functions

- `addProduct(name, priceUSD, rewardRatio)` - Add new product
- `updateProduct(productId, name, priceUSD, rewardRatio)` - Update existing product
- `toggleProduct(productId)` - Toggle product active status
- `withdrawUSDC(amount)` - Withdraw USDC tokens
- `withdrawAVAX(amount)` - Withdraw AVAX tokens
- `withdrawAllAVAX()` - Withdraw all AVAX tokens
- `fundContract(amount)` - Fund contract with BREWFI tokens

## Security Considerations

- ✅ Uses OpenZeppelin's audited contracts
- ✅ Access control on airdrop and product management functions
- ✅ Validates recipient addresses (no zero address)
- ✅ Validates amounts (must be greater than zero)
- ✅ Checks sufficient balance before airdropping
- ✅ Reentrancy protection on purchase functions
- ✅ Chainlink price feed integration for secure AVAX/USD conversion
- ✅ Owner must fund contract with BREWFI tokens before purchases
- ⚠️ Keep your private key secure and never commit it to version control
- ⚠️ Use `.gitignore` to exclude `.env` files
- ⚠️ Monitor contract balances and refill BREWFI tokens as needed

## Troubleshooting

### "Insufficient funds" error
- Get testnet AVAX from the faucet
- Ensure you have at least 0.1 AVAX

### "Insufficient token balance" error
- Check your BREWFI token balance
- Reduce airdrop amounts if necessary

### "Insufficient BREWFI balance" error (Purchase Contract)
- Fund the purchase contract with BREWFI tokens: `npm run fund:purchase`
- Check contract balance: `getBalances()` function

### "Insufficient AVAX amount" error
- Check current AVAX/USD price using `getAvaxUsdPrice()`
- Ensure you're sending enough AVAX to cover the USD price

### "Product is not active" error
- Check if the product is active using `getProduct(productId)`
- Owner can reactivate using `toggleProduct(productId)`

### Contract verification fails
- Ensure all source files are present
- Match compiler version and settings
- Use exact constructor arguments from deployment

## Getting Help

If you encounter issues:

1. Check that you're on the correct network (Fuji testnet)
2. Verify your `.env` file is configured correctly
3. Ensure you have sufficient AVAX for gas
4. Review the transaction on Snowtrace for detailed error messages

## Network Information

- **Network Name:** Avalanche Fuji C-Chain
- **Chain ID:** 43113
- **RPC URL:** https://api.avax-test.network/ext/bc/C/rpc
- **Block Explorer:** https://testnet.snowtrace.io/
- **Faucet:** https://faucet.avalanche.network/

## License

MIT

## Disclaimer

This is a test deployment on Fuji testnet. The token has no real value. For production deployments, ensure proper security audits and legal compliance.
