# CoffeeChain Smart Contracts ⚡

Foundry-based Solidity smart contracts for the $BREWFI token and CoffeeChain loyalty rewards system on Avalanche C-Chain.

## 🛠️ Tech Stack

- **Foundry** - Smart contract development toolkit
- **Solidity ^0.8.20** - Contract language
- **OpenZeppelin** - Secure contract libraries
- **Avalanche C-Chain** - Deployment target

## 📦 Installation

### Install Foundry

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Install Dependencies

```bash
# Install contract dependencies
forge install OpenZeppelin/openzeppelin-contracts
```

## 🚀 Building and Testing

```bash
# Compile contracts
forge build

# Run tests
forge test

# Run tests with verbosity
forge test -vvv

# Get test coverage
forge coverage

# Format code
forge fmt
```

## 📁 Contract Structure

```
contracts/
├── foundry.toml              # Foundry configuration
├── src/
│   ├── BrewFiToken.sol      # ERC-20 $BREWFI token
│   ├── RewardsManager.sol   # Loyalty rewards logic
│   └── CoffeeShopRegistry.sol
├── test/
│   ├── BrewFiToken.t.sol
│   └── RewardsManager.t.sol
└── script/
    └── Deploy.s.sol         # Deployment scripts
```

## 🔗 Key Contracts

### BrewFiToken.sol
ERC-20 token contract for $BREWFI with:
- Initial supply minting
- Burnable tokens
- Access control for minting

### RewardsManager.sol
Manages loyalty rewards:
- Track customer purchases
- Calculate and distribute rewards
- Handle redemptions

### CoffeeShopRegistry.sol
On-chain registry:
- Verify legitimate coffee shops
- Manage shop profiles
- Track shop performance

## 🌐 Deployment

### Deploy to Avalanche Testnet (Fuji)

```bash
# Set environment variables
export PRIVATE_KEY=0x...
export AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Deploy contracts
forge script script/Deploy.s.sol:DeployScript --rpc-url $AVALANCHE_RPC_URL --broadcast --verify
```

### Deploy to Avalanche Mainnet

```bash
export AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
forge script script/Deploy.s.sol:DeployScript --rpc-url $AVALANCHE_RPC_URL --broadcast --verify
```

## 🧪 Local Testing

```bash
# Start local Anvil node
anvil

# Deploy to local network
forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast
```

## 📊 Gas Optimization

```bash
# Gas snapshot
forge snapshot

# Compare gas usage
forge snapshot --diff
```

## 📝 Development Notes

This is a hackathon demo contract suite. For production:
- Complete security audit
- Add emergency pause functionality
- Implement timelocks for admin actions
- Add comprehensive events for indexing
- Deploy proxy contracts for upgradeability

## 🔐 Security Considerations

- [ ] Reentrancy guards on all state-changing functions
- [ ] Access control on administrative functions
- [ ] Input validation on all external calls
- [ ] SafeERC20 for token transfers
- [ ] Pausable functionality for emergencies

