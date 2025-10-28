# BREWFI Token Deployment Guide

This guide will walk you through deploying your BREWFI token on Avalanche Fuji Testnet.

## Quick Start

1. **Configure your environment**
   ```bash
   cp .env.example .env
   # Edit .env with your private key
   ```

2. **Get testnet AVAX**
   - Visit: https://faucet.avalanche.network/
   - Request testnet AVAX to your wallet address

3. **Deploy the contract**
   ```bash
   npm run deploy:fuji
   ```

4. **Configure airdrop**
   - Edit `airdrop-list.json` with recipient addresses and amounts

5. **Execute airdrop**
   ```bash
   npm run airdrop
   ```

## What You Need

- ✅ Private key from a wallet (never share this!)
- ✅ Testnet AVAX in your wallet (from faucet)
- ✅ Node.js installed on your computer
- ✅ Internet connection

## Step-by-Step Instructions

### 1. Setup Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Open `.env` in a text editor and add your private key:

```env
PRIVATE_KEY=your_actual_private_key_here
```

**⚠️ SECURITY WARNING:**
- Never share your private key with anyone
- Never commit `.env` to version control
- The `.gitignore` file prevents this automatically

### 2. Get Testnet AVAX

You need testnet AVAX to pay for transaction fees (gas):

1. Visit https://faucet.avalanche.network/
2. Enter your wallet address
3. Click "Request" for Fuji Testnet AVAX
4. Wait for the funds (usually instant)

You'll need approximately 0.1 AVAX for deployment and airdrops.

### 3. Add Avalanche Fuji to MetaMask (Optional)

If using MetaMask, add the Fuji network:

- **Network Name:** Avalanche Fuji C-Chain
- **RPC URL:** `https://api.avax-test.network/ext/bc/C/rpc`
- **Chain ID:** `43113`
- **Currency Symbol:** AVAX
- **Block Explorer:** `https://testnet.snowtrace.io`

### 4. Deploy Your Token

Run the deployment script:

```bash
npm run deploy:fuji
```

You'll see output like:

```
🚀 Deploying BrewFi Token to Avalanche Fuji Testnet...
📝 Deploying with account: 0xYourAddress...
✅ BREWFI Token deployed successfully!
📍 Contract Address: 0xContractAddress...
🔗 View on Snowtrace: https://testnet.snowtrace.io/address/0xContractAddress...
```

**Save the contract address!** You'll need it for airdrops and verification.

### 5. Configure Airdrop Recipients

Edit `airdrop-list.json`:

```json
{
  "recipients": [
    {
      "address": "0x1111111111111111111111111111111111111111",
      "amount": "1000"
    },
    {
      "address": "0x2222222222222222222222222222222222222222",
      "amount": "5000"
    },
    {
      "address": "0x3333333333333333333333333333333333333333",
      "amount": "25000"
    }
  ]
}
```

**Note:** Amounts are in whole tokens (add 18 decimals automatically).

### 6. Execute Airdrop

Run the airdrop script:

```bash
npm run airdrop
```

This will:
1. Load your deployment info
2. Read recipient list
3. Check your token balance
4. Execute the airdrop transaction
5. Display results

### 7. Verify Your Contract (Optional)

To verify your contract on Snowtrace:

1. Visit https://testnet.snowtrace.io/
2. Enter your contract address
3. Click "Contract" tab → "Verify and Publish"
4. Enter compiler details:
   - Compiler: v0.8.20
   - License: MIT
   - Optimization: Yes, 200 runs
5. Upload source code

## Token Specifications

Your BREWFI token has these properties:

- **Total Supply:** 10,000,000 BREWFI
- **Initial Owner:** Your deployer address receives all tokens
- **Decimals:** 18 (standard)
- **Network:** Avalanche Fuji (Chain ID: 43113)
- **Standard:** ERC-20 compliant

## Common Issues

### "Insufficient funds"
**Solution:** Get more testnet AVAX from the faucet.

### "Cannot find module"
**Solution:** Run `npm install` to install dependencies.

### "Invalid private key"
**Solution:** Ensure your `.env` file has the correct format (no quotes needed).

### "Insufficient token balance" (during airdrop)
**Solution:** You don't have enough BREWFI tokens. Reduce the airdrop amounts or deploy another contract.

### Contract verification fails
**Solution:** 
- Use exact compiler version (0.8.20)
- Enable optimization (200 runs)
- Match the deployment settings exactly

## Viewing Your Token

After deployment, you can:

1. **View on Snowtrace:**
   - Visit: https://testnet.snowtrace.io/address/YOUR_CONTRACT_ADDRESS
   - See all transactions and token holders

2. **Add to MetaMask:**
   - Open MetaMask
   - Click "Import tokens"
   - Enter contract address
   - Token symbol (BREWFI) and decimals (18) auto-fill
   - Click "Add Custom Token"

3. **View holders:**
   - Use Snowtrace's "Token" tab
   - See all addresses holding your token

## Next Steps

Once deployed, you can:

- ✅ Distribute tokens via airdrop
- ✅ Transfer tokens manually
- ✅ Share contract address for others to import
- ✅ Verify contract on Snowtrace for transparency
- ✅ Test all functionality on testnet
- ✅ Plan mainnet deployment (when ready)

## Production Deployment

When ready for mainnet (Avalanche Mainnet):

1. Update `hardhat.config.js` network settings
2. Get mainnet AVAX (this costs real money!)
3. Consider security audits
4. Review legal compliance
5. Update RPC URLs to mainnet

**Mainnet Details:**
- Chain ID: 43114
- RPC: https://api.avax.network/ext/bc/C/rpc
- Explorer: https://snowtrace.io/

## Support

For issues:

1. Check the README.md for detailed documentation
2. Review testnet.snowtrace.io for transaction details
3. Verify your configuration matches this guide

## Security Reminders

- 🔒 Never share your private key
- 🔒 Use testnet for development
- 🔒 Test thoroughly before mainnet
- 🔒 Keep `.env` file secure
- 🔒 Backup deployment information
- 🔒 Audit contracts before production

Good luck with your BREWFI token deployment! 🎉

