// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BrewFiTokenV2
 * @dev Enhanced ERC-20 Token with advanced features and security measures
 * @notice This contract includes role-based access control, pausable functionality,
 *         burning capabilities, controlled minting, tax mechanism, and vesting
 * Total Supply: 10,000,000 BREWFI tokens (with controlled minting capability)
 * Decimals: 18
 */
contract BrewFiTokenV2 is ERC20, AccessControl, Pausable, ReentrancyGuard {

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant TAX_MANAGER_ROLE = keccak256("TAX_MANAGER_ROLE");

    // Constants
    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 10**18;
    uint256 public constant MAX_SUPPLY = 50_000_000 * 10**18; // Maximum supply cap
    uint256 public constant MAX_TAX_RATE = 1000; // 10% maximum tax rate (in basis points)
    uint256 public constant BASIS_POINTS = 10000;

    // State variables
    uint256 public maxMintAmount = 1_000_000 * 10**18; // Maximum amount that can be minted in one transaction
    uint256 public taxRate = 0; // Tax rate in basis points (0 = no tax)
    address public taxWallet = address(0);
    bool public taxEnabled = false;
    
    // Blacklist and whitelist
    mapping(address => bool) public blacklisted;
    mapping(address => bool) public whitelisted;
    bool public whitelistEnabled = false;

    // Vesting
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        bool revocable;
        bool revoked;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    mapping(address => bool) public hasVestingSchedule;

    // Events
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    event TaxRateUpdated(uint256 oldRate, uint256 newRate);
    event TaxWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event TaxEnabled(bool enabled);
    event MaxMintAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event BlacklistUpdated(address indexed account, bool blacklisted);
    event WhitelistUpdated(address indexed account, bool whitelisted);
    event WhitelistEnabled(bool enabled);
    event VestingScheduleCreated(address indexed beneficiary, uint256 totalAmount, uint256 cliffDuration, uint256 vestingDuration);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary);

    // Modifiers
    modifier notBlacklisted(address account) {
        require(!blacklisted[account], "BrewFiTokenV2: account is blacklisted");
        _;
    }

    modifier onlyWhitelisted(address account) {
        if (whitelistEnabled) {
            require(whitelisted[account], "BrewFiTokenV2: account is not whitelisted");
        }
        _;
    }

    modifier validAddress(address account) {
        require(account != address(0), "BrewFiTokenV2: invalid address");
        _;
    }

    /**
     * @dev Constructor that sets up roles and mints initial supply
     * @param _owner The address that will receive all minted tokens and admin role
     */
    constructor(address _owner) ERC20("BrewFi Token V2", "BREWFI") validAddress(_owner) {
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        _grantRole(ADMIN_ROLE, _owner);
        _grantRole(MINTER_ROLE, _owner);
        _grantRole(BURNER_ROLE, _owner);
        _grantRole(PAUSER_ROLE, _owner);
        _grantRole(TAX_MANAGER_ROLE, _owner);

        // Mint initial supply
        _mint(_owner, INITIAL_SUPPLY);
        
        emit TokensMinted(_owner, INITIAL_SUPPLY, "Initial supply");
    }

    /**
     * @dev Override transfer to include tax and blacklist checks
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        notBlacklisted(msg.sender) 
        notBlacklisted(to)
        onlyWhitelisted(msg.sender)
        onlyWhitelisted(to)
        returns (bool) 
    {
        return _transferWithTax(msg.sender, to, amount);
    }

    /**
     * @dev Override transferFrom to include tax and blacklist checks
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        notBlacklisted(from) 
        notBlacklisted(to)
        onlyWhitelisted(from)
        onlyWhitelisted(to)
        returns (bool) 
    {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        return _transferWithTax(from, to, amount);
    }

    /**
     * @dev Internal function to handle transfers with tax
     */
    function _transferWithTax(address from, address to, uint256 amount) internal returns (bool) {
        if (taxEnabled && taxRate > 0 && taxWallet != address(0) && from != taxWallet && to != taxWallet) {
            uint256 taxAmount = amount * taxRate / BASIS_POINTS;
            uint256 transferAmount = amount - taxAmount;
            
            _transfer(from, to, transferAmount);
            _transfer(from, taxWallet, taxAmount);
        } else {
            _transfer(from, to, amount);
        }
        return true;
    }

    /**
     * @dev Mint tokens to a specific address (only MINTER_ROLE)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * @param reason Reason for minting (for event logging)
     */
    function mint(address to, uint256 amount, string calldata reason) 
        external 
        onlyRole(MINTER_ROLE) 
        validAddress(to)
        nonReentrant 
    {
        require(amount > 0, "BrewFiTokenV2: amount must be greater than zero");
        require(amount <= maxMintAmount, "BrewFiTokenV2: amount exceeds max mint amount");
        require(totalSupply() + amount <= MAX_SUPPLY, "BrewFiTokenV2: would exceed max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }

    /**
     * @dev Burn tokens from caller's balance (only BURNER_ROLE)
     * @param amount Amount of tokens to burn
     * @param reason Reason for burning (for event logging)
     */
    function burn(uint256 amount, string calldata reason) 
        external 
        onlyRole(BURNER_ROLE) 
        nonReentrant 
    {
        require(amount > 0, "BrewFiTokenV2: amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "BrewFiTokenV2: insufficient balance");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount, reason);
    }

    /**
     * @dev Burn tokens from a specific address (only BURNER_ROLE)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     * @param reason Reason for burning (for event logging)
     */
    function burnFrom(address from, uint256 amount, string calldata reason) 
        external 
        onlyRole(BURNER_ROLE) 
        validAddress(from)
        nonReentrant 
    {
        require(amount > 0, "BrewFiTokenV2: amount must be greater than zero");
        require(balanceOf(from) >= amount, "BrewFiTokenV2: insufficient balance");
        
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
        emit TokensBurned(from, amount, reason);
    }

    /**
     * @dev Pause all token transfers (only PAUSER_ROLE)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause all token transfers (only PAUSER_ROLE)
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Set tax rate (only TAX_MANAGER_ROLE)
     * @param _taxRate New tax rate in basis points (0-1000 for 0-10%)
     */
    function setTaxRate(uint256 _taxRate) external onlyRole(TAX_MANAGER_ROLE) {
        require(_taxRate <= MAX_TAX_RATE, "BrewFiTokenV2: tax rate exceeds maximum");
        
        uint256 oldRate = taxRate;
        taxRate = _taxRate;
        emit TaxRateUpdated(oldRate, _taxRate);
    }

    /**
     * @dev Set tax wallet address (only TAX_MANAGER_ROLE)
     * @param _taxWallet New tax wallet address
     */
    function setTaxWallet(address _taxWallet) external onlyRole(TAX_MANAGER_ROLE) validAddress(_taxWallet) {
        address oldWallet = taxWallet;
        taxWallet = _taxWallet;
        emit TaxWalletUpdated(oldWallet, _taxWallet);
    }

    /**
     * @dev Enable or disable tax mechanism (only TAX_MANAGER_ROLE)
     * @param _enabled Whether tax is enabled
     */
    function setTaxEnabled(bool _enabled) external onlyRole(TAX_MANAGER_ROLE) {
        taxEnabled = _enabled;
        emit TaxEnabled(_enabled);
    }

    /**
     * @dev Set maximum mint amount per transaction (only ADMIN_ROLE)
     * @param _maxMintAmount New maximum mint amount
     */
    function setMaxMintAmount(uint256 _maxMintAmount) external onlyRole(ADMIN_ROLE) {
        require(_maxMintAmount > 0, "BrewFiTokenV2: max mint amount must be greater than zero");
        
        uint256 oldAmount = maxMintAmount;
        maxMintAmount = _maxMintAmount;
        emit MaxMintAmountUpdated(oldAmount, _maxMintAmount);
    }

    /**
     * @dev Add or remove address from blacklist (only ADMIN_ROLE)
     * @param account Address to blacklist/unblacklist
     * @param _blacklisted Whether to blacklist or not
     */
    function setBlacklist(address account, bool _blacklisted) external onlyRole(ADMIN_ROLE) validAddress(account) {
        blacklisted[account] = _blacklisted;
        emit BlacklistUpdated(account, _blacklisted);
    }

    /**
     * @dev Add or remove address from whitelist (only ADMIN_ROLE)
     * @param account Address to whitelist/unwhitelist
     * @param _whitelisted Whether to whitelist or not
     */
    function setWhitelist(address account, bool _whitelisted) external onlyRole(ADMIN_ROLE) validAddress(account) {
        whitelisted[account] = _whitelisted;
        emit WhitelistUpdated(account, _whitelisted);
    }

    /**
     * @dev Enable or disable whitelist requirement (only ADMIN_ROLE)
     * @param _enabled Whether whitelist is enabled
     */
    function setWhitelistEnabled(bool _enabled) external onlyRole(ADMIN_ROLE) {
        whitelistEnabled = _enabled;
        emit WhitelistEnabled(_enabled);
    }

    /**
     * @dev Create a vesting schedule for a beneficiary (only ADMIN_ROLE)
     * @param beneficiary Address to receive vested tokens
     * @param totalAmount Total amount of tokens to vest
     * @param cliffDuration Duration before vesting starts (in seconds)
     * @param vestingDuration Total vesting duration (in seconds)
     * @param revocable Whether the vesting can be revoked
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 cliffDuration,
        uint256 vestingDuration,
        bool revocable
    ) external onlyRole(ADMIN_ROLE) validAddress(beneficiary) nonReentrant {
        require(totalAmount > 0, "BrewFiTokenV2: total amount must be greater than zero");
        require(vestingDuration > 0, "BrewFiTokenV2: vesting duration must be greater than zero");
        require(cliffDuration <= vestingDuration, "BrewFiTokenV2: cliff duration cannot exceed vesting duration");
        require(!hasVestingSchedule[beneficiary], "BrewFiTokenV2: beneficiary already has a vesting schedule");
        require(balanceOf(msg.sender) >= totalAmount, "BrewFiTokenV2: insufficient balance for vesting");

        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: totalAmount,
            releasedAmount: 0,
            startTime: block.timestamp,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            revocable: revocable,
            revoked: false
        });

        hasVestingSchedule[beneficiary] = true;
        
        // Transfer tokens to contract for vesting
        _transfer(msg.sender, address(this), totalAmount);
        
        emit VestingScheduleCreated(beneficiary, totalAmount, cliffDuration, vestingDuration);
    }

    /**
     * @dev Release vested tokens for a beneficiary
     * @param beneficiary Address to release tokens for
     */
    function releaseVestedTokens(address beneficiary) external nonReentrant {
        require(hasVestingSchedule[beneficiary], "BrewFiTokenV2: no vesting schedule found");
        
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(!schedule.revoked, "BrewFiTokenV2: vesting schedule has been revoked");
        
        uint256 releasableAmount = getReleasableAmount(beneficiary);
        require(releasableAmount > 0, "BrewFiTokenV2: no tokens available for release");
        
        schedule.releasedAmount = schedule.releasedAmount + releasableAmount;
        _transfer(address(this), beneficiary, releasableAmount);
        
        emit TokensReleased(beneficiary, releasableAmount);
    }

    /**
     * @dev Revoke a vesting schedule (only ADMIN_ROLE)
     * @param beneficiary Address whose vesting schedule to revoke
     */
    function revokeVestingSchedule(address beneficiary) external onlyRole(ADMIN_ROLE) validAddress(beneficiary) {
        require(hasVestingSchedule[beneficiary], "BrewFiTokenV2: no vesting schedule found");
        
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(schedule.revocable, "BrewFiTokenV2: vesting schedule is not revocable");
        require(!schedule.revoked, "BrewFiTokenV2: vesting schedule already revoked");
        
        schedule.revoked = true;
        
        // Transfer remaining tokens back to admin
        uint256 remainingAmount = schedule.totalAmount - schedule.releasedAmount;
        if (remainingAmount > 0) {
            _transfer(address(this), msg.sender, remainingAmount);
        }
        
        emit VestingRevoked(beneficiary);
    }

    /**
     * @dev Get the amount of tokens that can be released for a beneficiary
     * @param beneficiary Address to check
     * @return Amount of tokens that can be released
     */
    function getReleasableAmount(address beneficiary) public view returns (uint256) {
        if (!hasVestingSchedule[beneficiary]) {
            return 0;
        }
        
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        if (schedule.revoked) {
            return 0;
        }
        
        uint256 cliffEndTime = schedule.startTime + schedule.cliffDuration;
        if (block.timestamp < cliffEndTime) {
            return 0;
        }
        
        uint256 vestingEndTime = schedule.startTime + schedule.vestingDuration;
        uint256 currentTime = block.timestamp;
        
        if (currentTime >= vestingEndTime) {
            return schedule.totalAmount - schedule.releasedAmount;
        }
        
        uint256 vestedAmount = schedule.totalAmount * (currentTime - schedule.startTime) / schedule.vestingDuration;
        return vestedAmount - schedule.releasedAmount;
    }

    /**
     * @dev Get vesting schedule details for a beneficiary
     * @param beneficiary Address to check
     * @return Vesting schedule details
     */
    function getVestingSchedule(address beneficiary) external view returns (VestingSchedule memory) {
        require(hasVestingSchedule[beneficiary], "BrewFiTokenV2: no vesting schedule found");
        return vestingSchedules[beneficiary];
    }

    /**
     * @dev Emergency function to recover accidentally sent tokens (only ADMIN_ROLE)
     * @param token Address of the token to recover
     * @param amount Amount to recover
     */
    function recoverTokens(address token, uint256 amount) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(token != address(this), "BrewFiTokenV2: cannot recover BREWFI tokens");
        require(amount > 0, "BrewFiTokenV2: amount must be greater than zero");
        
        IERC20(token).transfer(msg.sender, amount);
    }

    /**
     * @dev Get contract information
     * @return tokenName Token name
     * @return tokenSymbol Token symbol
     * @return tokenDecimals Token decimals
     * @return currentTotalSupply Current total supply
     * @return maxSupply Maximum supply
     * @return currentTaxRate Current tax rate
     * @return isTaxEnabled Whether tax is enabled
     * @return isPaused Whether contract is paused
     */
    function getContractInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 currentTotalSupply,
        uint256 maxSupply,
        uint256 currentTaxRate,
        bool isTaxEnabled,
        bool isPaused
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_SUPPLY,
            taxRate,
            taxEnabled,
            paused()
        );
    }

    /**
     * @dev Override decimals to return 18
     * @return Number of decimals (always 18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    /**
     * @dev Override supportsInterface to include AccessControl
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}