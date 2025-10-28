# Contract Verification Guide

This guide explains how to verify your deployed contracts on Snowtrace (Avalanche Fuji Testnet explorer).

## Quick Verification Commands

### Automatic Verification (Recommended)
```bash
# Verify all contracts using deployment info
npm run verify:snowtrace
```

### Manual Verification
```bash
# Verify contracts with manually specified addresses
npm run verify:manual
```

## Manual Verification Process

If you need to verify contracts manually with specific addresses:

### 1. Edit the Manual Verification Script
Open `scripts/verifyManual.js` and update the contract addresses and constructor arguments:

```javascript
const CONTRACTS = {
    purchaseContract: {
        address: "0xYourContractAddress", // Replace with your contract address
        constructorArgs: [
            "0x9a13d88490e21809Fac732C18ff13EB4849e4630", // BREWFI token address
            "0x5425890298aed601595a70AB815c96711a31Bc65", // USDC token address
            "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD", // AVAX/USD price feed
            "0xYourDeployerAddress"  // Owner address
        ]
    }
};
```

### 2. Run Manual Verification
```bash
npm run verify:manual
```

## Direct Hardhat Verification

You can also verify contracts directly using Hardhat:

### BrewFiPurchase Contract
```bash
npx hardhat verify --network snowtrace <CONTRACT_ADDRESS> \
    "0x9a13d88490e21809Fac732C18ff13EB4849e4630" \
    "0x5425890298aed601595a70AB815c96711a31Bc65" \
    "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD" \
    "0xYourDeployerAddress"
```

### BREWFI Token Contract
```bash
npx hardhat verify --network snowtrace <TOKEN_ADDRESS> \
    "BrewFi Token" \
    "BREWFI" \
    "1000000000000000000000000" \
    "0xYourDeployerAddress"
```

## Constructor Arguments Reference

### BrewFiPurchase Constructor
1. `_brewfiToken`: BREWFI token contract address
2. `_usdcToken`: USDC token contract address  
3. `_avaxUsdPriceFeed`: AVAX/USD Chainlink price feed address
4. `_owner`: Contract owner address (deployer)

### BREWFI Token Constructor
1. `name`: Token name ("BrewFi Token")
2. `symbol`: Token symbol ("BREWFI")
3. `initialSupply`: Initial token supply (in wei)
4. `owner`: Token owner address (deployer)

## Fuji Testnet Addresses

- **USDC**: `0x5425890298aed601595a70AB815c96711a31Bc65`
- **AVAX/USD Price Feed**: `0x5498BB86BC934c8D34FDA08E81D444153d0D06aD`
- **BREWFI Token**: `0x9a13d88490e21809Fac732C18ff13EB4849e4630`

## Troubleshooting

### Common Issues

1. **"Already Verified"**: Contract is already verified on the explorer
2. **"Constructor arguments mismatch"**: Check that constructor arguments match exactly
3. **"Contract not found"**: Ensure the contract address is correct
4. **"Network not supported"**: Make sure you're using the correct network name

### Verification Tips

- Always use the exact constructor arguments from your deployment
- Check that the contract address is correct
- Ensure you're connected to the right network
- Wait a few minutes after deployment before verifying

## Explorer Links

After successful verification, your contracts will be available at:
- **Snowtrace**: https://testnet.snowtrace.io/address/<CONTRACT_ADDRESS>
