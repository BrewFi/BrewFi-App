// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Price feed interface (compatible with Chainlink AggregatorV3Interface)
interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

/**
 * @title BrewFiPurchase
 * @dev Contract for purchasing products with USDC or AVAX and receiving BREWFI token rewards
 * @notice Users can buy products and automatically receive BREWFI tokens based on product configuration
 */
contract BrewFiPurchase is Ownable, ReentrancyGuard {
    // Events
    event ProductAdded(uint256 indexed productId, string name, uint256 priceUSD, uint256 rewardRatio);
    event ProductUpdated(uint256 indexed productId, string name, uint256 priceUSD, uint256 rewardRatio);
    event PurchaseWithUSDC(address indexed buyer, uint256 indexed productId, uint256 usdcAmount, uint256 brewfiReward);
    event PurchaseWithAVAX(address indexed buyer, uint256 indexed productId, uint256 avaxAmount, uint256 brewfiReward);
    event FundsWithdrawn(address indexed token, uint256 amount);
    event ContractFunded(address indexed token, uint256 amount);

    // Structs
    struct Product {
        string name;
        uint256 priceUSD; // Price in USD (scaled by 1e6 for USDC precision)
        uint256 rewardRatio; // Reward ratio (scaled by 1e18, e.g., 1e18 = 1.0x)
        bool active;
    }

    // State variables
    IERC20 public immutable brewfiToken;
    IERC20 public immutable usdcToken;
    AggregatorV3Interface public immutable avaxUsdPriceFeed;
    
    Product[] public products;
    uint256 public constant USD_PRECISION = 1e6; // USDC has 6 decimals
    uint256 public constant REWARD_PRECISION = 1e18; // BREWFI has 18 decimals
    uint256 public constant PRICE_FEED_PRECISION = 1e8; // Chainlink feeds have 8 decimals

    // Constructor
    constructor(
        address _brewfiToken,
        address _usdcToken,
        address _avaxUsdPriceFeed,
        address _owner
    ) Ownable(_owner) {
        require(_brewfiToken != address(0), "BrewFiPurchase: invalid BREWFI token address");
        require(_usdcToken != address(0), "BrewFiPurchase: invalid USDC token address");
        require(_avaxUsdPriceFeed != address(0), "BrewFiPurchase: invalid price feed address");
        
        brewfiToken = IERC20(_brewfiToken);
        usdcToken = IERC20(_usdcToken);
        avaxUsdPriceFeed = AggregatorV3Interface(_avaxUsdPriceFeed);
    }

    /**
     * @dev Add a new product
     * @param name Product name
     * @param priceUSD Price in USD (scaled by 1e6)
     * @param rewardRatio Reward ratio (scaled by 1e18)
     */
    function addProduct(
        string calldata name,
        uint256 priceUSD,
        uint256 rewardRatio
    ) external onlyOwner {
        require(priceUSD > 0, "BrewFiPurchase: price must be greater than zero");
        require(rewardRatio > 0, "BrewFiPurchase: reward ratio must be greater than zero");
        
        products.push(Product({
            name: name,
            priceUSD: priceUSD,
            rewardRatio: rewardRatio,
            active: true
        }));
        
        emit ProductAdded(products.length - 1, name, priceUSD, rewardRatio);
    }

    /**
     * @dev Update an existing product
     * @param productId Product ID to update
     * @param name New product name
     * @param priceUSD New price in USD
     * @param rewardRatio New reward ratio
     */
    function updateProduct(
        uint256 productId,
        string calldata name,
        uint256 priceUSD,
        uint256 rewardRatio
    ) external onlyOwner {
        require(productId < products.length, "BrewFiPurchase: invalid product ID");
        require(priceUSD > 0, "BrewFiPurchase: price must be greater than zero");
        require(rewardRatio > 0, "BrewFiPurchase: reward ratio must be greater than zero");
        
        products[productId] = Product({
            name: name,
            priceUSD: priceUSD,
            rewardRatio: rewardRatio,
            active: products[productId].active
        });
        
        emit ProductUpdated(productId, name, priceUSD, rewardRatio);
    }

    /**
     * @dev Toggle product active status
     * @param productId Product ID to toggle
     */
    function toggleProduct(uint256 productId) external onlyOwner {
        require(productId < products.length, "BrewFiPurchase: invalid product ID");
        products[productId].active = !products[productId].active;
    }

    /**
     * @dev Purchase product with USDC
     * @param productId Product ID to purchase
     */
    function purchaseWithUSDC(uint256 productId) external nonReentrant {
        require(productId < products.length, "BrewFiPurchase: invalid product ID");
        Product memory product = products[productId];
        require(product.active, "BrewFiPurchase: product is not active");
        
        uint256 brewfiReward = calculateBrewfiReward(product.priceUSD, product.rewardRatio);
        require(brewfiToken.balanceOf(address(this)) >= brewfiReward, "BrewFiPurchase: insufficient BREWFI balance");
        
        // Transfer USDC from buyer to contract
        require(usdcToken.transferFrom(msg.sender, address(this), product.priceUSD), "BrewFiPurchase: USDC transfer failed");
        
        // Transfer BREWFI tokens to buyer
        require(brewfiToken.transfer(msg.sender, brewfiReward), "BrewFiPurchase: BREWFI transfer failed");
        
        emit PurchaseWithUSDC(msg.sender, productId, product.priceUSD, brewfiReward);
    }

    /**
     * @dev Purchase product with AVAX
     * @param productId Product ID to purchase
     */
    function purchaseWithAVAX(uint256 productId) external payable nonReentrant {
        require(productId < products.length, "BrewFiPurchase: invalid product ID");
        Product memory product = products[productId];
        require(product.active, "BrewFiPurchase: product is not active");
        require(msg.value > 0, "BrewFiPurchase: AVAX amount must be greater than zero");
        
        // Get AVAX/USD price from Chainlink
        uint256 avaxUsdPrice = getAvaxUsdPrice();
        require(avaxUsdPrice > 0, "BrewFiPurchase: invalid AVAX price");
        
        // Calculate required AVAX amount
        uint256 requiredAvax = (product.priceUSD * PRICE_FEED_PRECISION) / avaxUsdPrice;
        require(msg.value >= requiredAvax, "BrewFiPurchase: insufficient AVAX amount");
        
        uint256 brewfiReward = calculateBrewfiReward(product.priceUSD, product.rewardRatio);
        require(brewfiToken.balanceOf(address(this)) >= brewfiReward, "BrewFiPurchase: insufficient BREWFI balance");
        
        // Transfer BREWFI tokens to buyer
        require(brewfiToken.transfer(msg.sender, brewfiReward), "BrewFiPurchase: BREWFI transfer failed");
        
        // Refund excess AVAX if any
        if (msg.value > requiredAvax) {
            payable(msg.sender).transfer(msg.value - requiredAvax);
        }
        
        emit PurchaseWithAVAX(msg.sender, productId, requiredAvax, brewfiReward);
    }

    /**
     * @dev Calculate BREWFI reward amount
     * @param priceUSD Product price in USD
     * @param rewardRatio Reward ratio
     * @return BREWFI reward amount
     */
    function calculateBrewfiReward(uint256 priceUSD, uint256 rewardRatio) public pure returns (uint256) {
        // Convert priceUSD from USDC precision (6 decimals) to BREWFI precision (18 decimals)
        // Then apply reward ratio
        return (priceUSD * 1e12 * rewardRatio) / REWARD_PRECISION;
    }

    /**
     * @dev Get AVAX/USD price from Chainlink
     * @return AVAX price in USD (scaled by 1e8)
     */
    function getAvaxUsdPrice() public view returns (uint256) {
        (, int256 price, , , ) = avaxUsdPriceFeed.latestRoundData();
        require(price > 0, "BrewFiPurchase: invalid price feed data");
        return uint256(price);
    }

    /**
     * @dev Get product count
     * @return Number of products
     */
    function getProductCount() external view returns (uint256) {
        return products.length;
    }

    /**
     * @dev Get product details
     * @param productId Product ID
     * @return Product details
     */
    function getProduct(uint256 productId) external view returns (Product memory) {
        require(productId < products.length, "BrewFiPurchase: invalid product ID");
        return products[productId];
    }

    /**
     * @dev Get all products
     * @return Array of all products
     */
    function getAllProducts() external view returns (Product[] memory) {
        return products;
    }

    /**
     * @dev Withdraw USDC tokens (owner only)
     * @param amount Amount to withdraw
     */
    function withdrawUSDC(uint256 amount) external onlyOwner {
        require(amount > 0, "BrewFiPurchase: amount must be greater than zero");
        require(usdcToken.balanceOf(address(this)) >= amount, "BrewFiPurchase: insufficient USDC balance");
        
        require(usdcToken.transfer(owner(), amount), "BrewFiPurchase: USDC transfer failed");
        emit FundsWithdrawn(address(usdcToken), amount);
    }

    /**
     * @dev Withdraw AVAX tokens (owner only)
     * @param amount Amount to withdraw
     */
    function withdrawAVAX(uint256 amount) external onlyOwner {
        require(amount > 0, "BrewFiPurchase: amount must be greater than zero");
        require(address(this).balance >= amount, "BrewFiPurchase: insufficient AVAX balance");
        
        payable(owner()).transfer(amount);
        emit FundsWithdrawn(address(0), amount);
    }

    /**
     * @dev Withdraw all AVAX tokens (owner only)
     */
    function withdrawAllAVAX() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "BrewFiPurchase: no AVAX to withdraw");
        
        payable(owner()).transfer(balance);
        emit FundsWithdrawn(address(0), balance);
    }

    /**
     * @dev Fund contract with BREWFI tokens (owner only)
     * @param amount Amount to fund
     */
    function fundContract(uint256 amount) external onlyOwner {
        require(amount > 0, "BrewFiPurchase: amount must be greater than zero");
        require(brewfiToken.transferFrom(owner(), address(this), amount), "BrewFiPurchase: BREWFI transfer failed");
        emit ContractFunded(address(brewfiToken), amount);
    }

    /**
     * @dev Get contract balances
     * @return brewfiBalance BREWFI balance
     * @return usdcBalance USDC balance
     * @return avaxBalance AVAX balance
     */
    function getBalances() external view returns (uint256 brewfiBalance, uint256 usdcBalance, uint256 avaxBalance) {
        brewfiBalance = brewfiToken.balanceOf(address(this));
        usdcBalance = usdcToken.balanceOf(address(this));
        avaxBalance = address(this).balance;
    }

    // Allow contract to receive AVAX
    receive() external payable {}
}
