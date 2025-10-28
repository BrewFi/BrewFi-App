# BrewFiTokenV2 - Enhanced ERC-20 Token Contract

## Overview

BrewFiTokenV2 is a comprehensive, production-ready ERC-20 token contract that implements advanced features and security measures following industry best practices. This contract extends the basic ERC-20 functionality with role-based access control, tax mechanisms, vesting schedules, and comprehensive security features.

## Key Features

### 🔐 Security Features
- **Pausable**: Emergency pause/unpause functionality
- **Blacklist/Whitelist**: Address-based transfer restrictions
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Access Control**: Role-based permissions system
- **Input Validation**: Comprehensive parameter validation

### 🎯 Access Control System
- **ADMIN_ROLE**: Full administrative control
- **MINTER_ROLE**: Token minting permissions
- **BURNER_ROLE**: Token burning permissions
- **PAUSER_ROLE**: Pause/unpause permissions
- **TAX_MANAGER_ROLE**: Tax mechanism control

### 💰 Token Economics
- **Initial Supply**: 10,000,000 BREWFI tokens
- **Max Supply**: 50,000,000 BREWFI tokens (hard cap)
- **Max Mint Amount**: 1,000,000 tokens per transaction
- **Decimals**: 18 (standard ERC-20)
- **Tax Mechanism**: Configurable transfer taxes (0-10%)

### 📈 Advanced Features
- **Controlled Minting**: Role-based minting with supply limits
- **Token Burning**: Deflationary mechanism
- **Vesting Schedules**: Time-locked token distribution
- **Tax System**: Optional transfer taxes with configurable rates
- **Emergency Functions**: Token recovery and emergency controls

## Contract Architecture

### Inheritance Hierarchy
```
BrewFiTokenV2
├── ERC20 (OpenZeppelin)
├── AccessControl (OpenZeppelin)
├── Pausable (OpenZeppelin)
└── ReentrancyGuard (OpenZeppelin)
```

### Key Constants
```solidity
uint256 public constant INITIAL_SUPPLY = 10_000_000 * 10**18;
uint256 public constant MAX_SUPPLY = 50_000_000 * 10**18;
uint256 public constant MAX_TAX_RATE = 1000; // 10%
uint256 public constant BASIS_POINTS = 10000;
```

## Function Reference

### Core Token Functions

#### `mint(address to, uint256 amount, string reason)`
- **Access**: MINTER_ROLE
- **Purpose**: Mint new tokens to specified address
- **Validation**: Amount ≤ maxMintAmount, Total supply ≤ MAX_SUPPLY
- **Events**: `TokensMinted`

#### `burn(uint256 amount, string reason)`
- **Access**: BURNER_ROLE
- **Purpose**: Burn tokens from caller's balance
- **Validation**: Sufficient balance, amount > 0
- **Events**: `TokensBurned`

#### `burnFrom(address from, uint256 amount, string reason)`
- **Access**: BURNER_ROLE
- **Purpose**: Burn tokens from specified address
- **Validation**: Sufficient balance and allowance
- **Events**: `TokensBurned`

### Security Functions

#### `pause()` / `unpause()`
- **Access**: PAUSER_ROLE
- **Purpose**: Emergency pause/unpause all transfers
- **Effect**: Prevents all token transfers when paused

#### `setBlacklist(address account, bool blacklisted)`
- **Access**: ADMIN_ROLE
- **Purpose**: Add/remove addresses from blacklist
- **Effect**: Prevents transfers to/from blacklisted addresses

#### `setWhitelist(address account, bool whitelisted)`
- **Access**: ADMIN_ROLE
- **Purpose**: Add/remove addresses from whitelist
- **Effect**: Restricts transfers to whitelisted addresses only

### Tax System

#### `setTaxRate(uint256 taxRate)`
- **Access**: TAX_MANAGER_ROLE
- **Purpose**: Set transfer tax rate (0-1000 basis points)
- **Validation**: taxRate ≤ MAX_TAX_RATE
- **Events**: `TaxRateUpdated`

#### `setTaxWallet(address taxWallet)`
- **Access**: TAX_MANAGER_ROLE
- **Purpose**: Set address to receive tax payments
- **Validation**: Non-zero address
- **Events**: `TaxWalletUpdated`

#### `setTaxEnabled(bool enabled)`
- **Access**: TAX_MANAGER_ROLE
- **Purpose**: Enable/disable tax mechanism
- **Events**: `TaxEnabled`

### Vesting System

#### `createVestingSchedule(address beneficiary, uint256 totalAmount, uint256 cliffDuration, uint256 vestingDuration, bool revocable)`
- **Access**: ADMIN_ROLE
- **Purpose**: Create time-locked token distribution
- **Parameters**:
  - `beneficiary`: Address to receive vested tokens
  - `totalAmount`: Total tokens to vest
  - `cliffDuration`: Time before vesting starts (seconds)
  - `vestingDuration`: Total vesting period (seconds)
  - `revocable`: Whether admin can revoke vesting
- **Events**: `VestingScheduleCreated`

#### `releaseVestedTokens(address beneficiary)`
- **Access**: Public
- **Purpose**: Release available vested tokens
- **Validation**: Vesting schedule exists, not revoked, tokens available
- **Events**: `TokensReleased`

#### `revokeVestingSchedule(address beneficiary)`
- **Access**: ADMIN_ROLE
- **Purpose**: Revoke vesting schedule (if revocable)
- **Validation**: Schedule exists, is revocable, not already revoked
- **Events**: `VestingRevoked`

### Utility Functions

#### `getContractInfo()`
- **Access**: Public view
- **Returns**: Complete contract state information
- **Purpose**: Frontend integration and monitoring

#### `getReleasableAmount(address beneficiary)`
- **Access**: Public view
- **Returns**: Amount of tokens available for release
- **Purpose**: Vesting schedule queries

#### `recoverTokens(address token, uint256 amount)`
- **Access**: ADMIN_ROLE
- **Purpose**: Emergency recovery of accidentally sent tokens
- **Validation**: Token ≠ BREWFI, amount > 0

## Events

### Core Events
- `TokensMinted(address indexed to, uint256 amount, string reason)`
- `TokensBurned(address indexed from, uint256 amount, string reason)`

### Tax Events
- `TaxRateUpdated(uint256 oldRate, uint256 newRate)`
- `TaxWalletUpdated(address indexed oldWallet, address indexed newWallet)`
- `TaxEnabled(bool enabled)`

### Security Events
- `BlacklistUpdated(address indexed account, bool blacklisted)`
- `WhitelistUpdated(address indexed account, bool whitelisted)`
- `WhitelistEnabled(bool enabled)`

### Vesting Events
- `VestingScheduleCreated(address indexed beneficiary, uint256 totalAmount, uint256 cliffDuration, uint256 vestingDuration)`
- `TokensReleased(address indexed beneficiary, uint256 amount)`
- `VestingRevoked(address indexed beneficiary)`

## Usage Examples

### Basic Token Operations
```solidity
// Mint tokens
await brewFiTokenV2.mint(userAddress, ethers.parseEther("1000"), "User reward");

// Burn tokens
await brewFiTokenV2.burn(ethers.parseEther("100"), "Token burn");

// Transfer with tax
await brewFiTokenV2.transfer(recipientAddress, ethers.parseEther("1000"));
```

### Tax Configuration
```solidity
// Set 5% tax rate
await brewFiTokenV2.setTaxRate(500); // 500 basis points = 5%
await brewFiTokenV2.setTaxWallet(taxWalletAddress);
await brewFiTokenV2.setTaxEnabled(true);
```

### Vesting Schedule
```solidity
// Create 4-year vesting with 1-year cliff
const cliffDuration = 365 * 24 * 60 * 60; // 1 year
const vestingDuration = 4 * 365 * 24 * 60 * 60; // 4 years

await brewFiTokenV2.createVestingSchedule(
    beneficiaryAddress,
    ethers.parseEther("10000"),
    cliffDuration,
    vestingDuration,
    true // revocable
);
```

### Security Operations
```solidity
// Emergency pause
await brewFiTokenV2.pause();

// Blacklist malicious address
await brewFiTokenV2.setBlacklist(maliciousAddress, true);

// Enable whitelist mode
await brewFiTokenV2.setWhitelistEnabled(true);
await brewFiTokenV2.setWhitelist(trustedAddress, true);
```

## Security Considerations

### Access Control
- All administrative functions require specific roles
- Role assignments are logged and auditable
- Default admin role can manage all other roles

### Tax Mechanism
- Tax rate capped at 10% maximum
- Tax wallet must be set before enabling taxes
- Tax-free transfers between tax wallet and other addresses

### Vesting Security
- Vesting schedules are immutable once created
- Revocable vesting can be revoked by admin
- Tokens are held in contract until released

### Emergency Procedures
- Contract can be paused to halt all transfers
- Blacklist can immediately block malicious addresses
- Token recovery function for accidentally sent tokens

## Gas Optimization

### Efficient Storage Patterns
- Packed structs for vesting schedules
- Minimal state variable updates
- Batch operations where possible

### Gas-Efficient Functions
- View functions for queries
- Optimized transfer logic
- Minimal external calls

## Testing

The contract includes comprehensive test coverage:
- Unit tests for all functions
- Integration tests for complex workflows
- Edge case testing
- Gas usage optimization tests

Run tests with:
```bash
npx hardhat test test/BrewFiTokenV2.test.js
```

## Deployment

Deploy the contract with:
```bash
npx hardhat run scripts/deployV2.js --network <network>
```

## Upgrade Path

While this contract is not upgradeable by design (for security), future versions can be deployed as new contracts with migration mechanisms.

## Audit Recommendations

Before mainnet deployment:
1. Professional security audit
2. Gas optimization review
3. Integration testing with frontend
4. Multi-signature wallet setup for admin functions
5. Timelock contract for critical operations

## License

MIT License - See LICENSE file for details.

## Support

For technical support or questions about implementation, please refer to the test files and deployment scripts for examples.
