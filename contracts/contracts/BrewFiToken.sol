// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BrewFiToken
 * @dev ERC-20 Token with batch airdrop functionality
 * Total Supply: 10,000,000 BREWFI tokens
 * Decimals: 18
 */
contract BrewFiToken is ERC20, Ownable {
    // Events
    event AirdropExecuted(address indexed recipient, uint256 amount);
    event BatchAirdropExecuted(uint256 totalRecipients, uint256 totalAmount);

    /**
     * @dev Constructor that mints total supply to deployer
     * @param _owner The address that will receive all minted tokens
     */
    constructor(address _owner) ERC20("BrewFi Token", "BREWFI") Ownable(_owner) {
        // Mint 10,000,000 tokens with 18 decimals
        // Total: 10,000,000 * 10^18
        uint256 totalSupply = 10_000_000 * 10**decimals();
        _mint(_owner, totalSupply);
    }

    /**
     * @dev Airdrop tokens to a single recipient
     * @param recipient Address to receive tokens
     * @param amount Amount of tokens to airdrop (in smallest unit, e.g., wei)
     */
    function airdrop(address recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "BrewFiToken: recipient cannot be zero address");
        require(amount > 0, "BrewFiToken: amount must be greater than zero");
        require(balanceOf(owner()) >= amount, "BrewFiToken: insufficient balance for airdrop");
        
        _transfer(owner(), recipient, amount);
        emit AirdropExecuted(recipient, amount);
    }

    /**
     * @dev Airdrop tokens to multiple recipients
     * @param recipients Array of addresses to receive tokens
     * @param amounts Array of amounts corresponding to each recipient
     */
    function batchAirdrop(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "BrewFiToken: arrays length mismatch");
        require(recipients.length > 0, "BrewFiToken: recipients array is empty");
        
        uint256 totalAmount = 0;
        
        // Validate all recipients and calculate total amount
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "BrewFiToken: recipient cannot be zero address");
            require(amounts[i] > 0, "BrewFiToken: amount must be greater than zero");
            totalAmount += amounts[i];
        }
        
        // Check if owner has sufficient balance
        require(balanceOf(owner()) >= totalAmount, "BrewFiToken: insufficient balance for batch airdrop");
        
        // Execute transfers
        for (uint256 i = 0; i < recipients.length; i++) {
            _transfer(owner(), recipients[i], amounts[i]);
            emit AirdropExecuted(recipients[i], amounts[i]);
        }
        
        emit BatchAirdropExecuted(recipients.length, totalAmount);
    }

    /**
     * @dev Get total supply in human-readable format
     * @return Total supply divided by 10^18
     */
    function getTotalSupply() external pure returns (uint256) {
        return 10_000_000;
    }

    /**
     * @dev Override decimals to return 18
     * @return Number of decimals (always 18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}

