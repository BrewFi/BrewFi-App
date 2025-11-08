// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

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
 * @dev Contract for purchasing products with USDC, USDT, or AVAX and receiving BREWFI token rewards
 * @notice Users can buy products and automatically receive BREWFI tokens based on product configuration
 */
contract BrewFiPurchase is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Events
    event ProductAdded(uint256 indexed productId, string name, uint256 priceUSD, uint256 rewardRatio);
    event ProductUpdated(uint256 indexed productId, string name, uint256 priceUSD, uint256 rewardRatio);
    event ProductToggled(uint256 indexed productId, bool active);
    event PurchaseWithUSDC(address indexed buyer, uint256 indexed productId, uint256 usdcAmount, uint256 brewfiReward);
    event PurchaseWithUSDT(address indexed buyer, uint256 indexed productId, uint256 usdtAmount, uint256 brewfiReward);
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
    IERC20 public immutable usdtToken;
    AggregatorV3Interface public immutable avaxUsdPriceFeed;
    
    Product[] public products;
    uint256 public constant USD_PRECISION = 1e6; // USDC has 6 decimals
    uint256 public constant REWARD_PRECISION = 1e18; // BREWFI has 18 decimals
    uint256 public constant PRICE_FEED_PRECISION = 1e8; // Chainlink feeds have 8 decimals
    uint256 public constant MAX_PRICE_FEED_STALENESS = 3600; // Maximum price feed staleness in seconds (1 hour)
    uint256 public constant MAX_PRODUCTS = 1000; // Maximum number of products
    uint256 public constant MAX_PRICE_USD = 1_000_000 * USD_PRECISION; // Maximum price: $1,000,000
    uint256 public constant MAX_REWARD_RATIO = 100 * REWARD_PRECISION; // Maximum reward ratio: 100x

    // Constructor
    constructor(
        address _brewfiToken,
        address _usdcToken,
        address _usdtToken,
        address _avaxUsdPriceFeed,
        address _owner
    ) Ownable(_owner) {
        require(_brewfiToken != address(0), "BrewFiPurchase: invalid BREWFI token address");
        require(_usdcToken != address(0), "BrewFiPurchase: invalid USDC token address");
        require(_usdtToken != address(0), "BrewFiPurchase: invalid USDT token address");
        require(_avaxUsdPriceFeed != address(0), "BrewFiPurchase: invalid price feed address");
        
        brewfiToken = IERC20(_brewfiToken);
        usdcToken = IERC20(_usdcToken);
        usdtToken = IERC20(_usdtToken);
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
    ) external onlyOwner whenNotPaused {
        require(products.length < MAX_PRODUCTS, "BrewFiPurchase: maximum products limit reached");
        require(priceUSD > 0, "BrewFiPurchase: price must be greater than zero");
        require(priceUSD <= MAX_PRICE_USD, "BrewFiPurchase: price exceeds maximum");
        require(rewardRatio > 0, "BrewFiPurchase: reward ratio must be greater than zero");
        require(rewardRatio <= MAX_REWARD_RATIO, "BrewFiPurchase: reward ratio exceeds maximum");
        
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
    ) external onlyOwner whenNotPaused {
        require(productId < products.length, "BrewFiPurchase: invalid product ID");
        require(priceUSD > 0, "BrewFiPurchase: price must be greater than zero");
        require(priceUSD <= MAX_PRICE_USD, "BrewFiPurchase: price exceeds maximum");
        require(rewardRatio > 0, "BrewFiPurchase: reward ratio must be greater than zero");
        require(rewardRatio <= MAX_REWARD_RATIO, "BrewFiPurchase: reward ratio exceeds maximum");
        
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
        emit ProductToggled(productId, products[productId].active);
    }

    /**
     * @dev Purchase product with USDC
     * @param productId Product ID to purchase
     */
    function purchaseWithUSDC(uint256 productId) external nonReentrant whenNotPaused {
        require(productId < products.length, "BrewFiPurchase: invalid product ID");
        Product memory product = products[productId];
        require(product.active, "BrewFiPurchase: product is not active");
        
        uint256 brewfiReward = calculateBrewfiReward(product.priceUSD, product.rewardRatio);
        require(brewfiToken.balanceOf(address(this)) >= brewfiReward, "BrewFiPurchase: insufficient BREWFI balance");
        
        // Transfer USDC from buyer to contract
        usdcToken.safeTransferFrom(msg.sender, address(this), product.priceUSD);
        
        // Transfer BREWFI tokens to buyer
        brewfiToken.safeTransfer(msg.sender, brewfiReward);
        
        emit PurchaseWithUSDC(msg.sender, productId, product.priceUSD, brewfiReward);
    }

    /**
     * @dev Purchase product with USDT
     * @param productId Product ID to purchase
     */
    function purchaseWithUSDT(uint256 productId) external nonReentrant whenNotPaused {
        require(productId < products.length, "BrewFiPurchase: invalid product ID");
        Product memory product = products[productId];
        require(product.active, "BrewFiPurchase: product is not active");
        
        uint256 brewfiReward = calculateBrewfiReward(product.priceUSD, product.rewardRatio);
        require(brewfiToken.balanceOf(address(this)) >= brewfiReward, "BrewFiPurchase: insufficient BREWFI balance");
        
        // Transfer USDT from buyer to contract
        usdtToken.safeTransferFrom(msg.sender, address(this), product.priceUSD);
        
        // Transfer BREWFI tokens to buyer
        brewfiToken.safeTransfer(msg.sender, brewfiReward);
        
        emit PurchaseWithUSDT(msg.sender, productId, product.priceUSD, brewfiReward);
    }

    /**
     * @dev Purchase product with AVAX
     * @param productId Product ID to purchase
     * @param minBrewfiReward Minimum BREWFI reward amount (slippage protection)
     */
    function purchaseWithAVAX(uint256 productId, uint256 minBrewfiReward) external payable nonReentrant whenNotPaused {
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
        require(brewfiReward >= minBrewfiReward, "BrewFiPurchase: slippage too high");
        require(brewfiToken.balanceOf(address(this)) >= brewfiReward, "BrewFiPurchase: insufficient BREWFI balance");
        
        // Transfer BREWFI tokens to buyer
        brewfiToken.safeTransfer(msg.sender, brewfiReward);
        
        // Refund excess AVAX if any (use call instead of transfer for better compatibility)
        if (msg.value > requiredAvax) {
            uint256 refundAmount = msg.value - requiredAvax;
            (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
            require(success, "BrewFiPurchase: AVAX refund failed");
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
     * @dev Get AVAX/USD price from Chainlink with staleness check
     * @return AVAX price in USD (scaled by 1e8)
     */
    function getAvaxUsdPrice() public view returns (uint256) {
        (, int256 price, , uint256 updatedAt, ) = avaxUsdPriceFeed.latestRoundData();
        require(price > 0, "BrewFiPurchase: invalid price feed data");
        require(block.timestamp >= updatedAt, "BrewFiPurchase: invalid price feed timestamp");
        require(block.timestamp - updatedAt <= MAX_PRICE_FEED_STALENESS, "BrewFiPurchase: price feed data too stale");
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
        
        usdcToken.safeTransfer(owner(), amount);
        emit FundsWithdrawn(address(usdcToken), amount);
    }

    /**
     * @dev Withdraw all USDC tokens (owner only)
     */
    function withdrawAllUSDC() external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        require(balance > 0, "BrewFiPurchase: no USDC to withdraw");
        usdcToken.safeTransfer(owner(), balance);
        emit FundsWithdrawn(address(usdcToken), balance);
    }
    /**
     * @dev Withdraw AVAX tokens (owner only)
     * @param amount Amount to withdraw
     */
    function withdrawAVAX(uint256 amount) external onlyOwner {
        require(amount > 0, "BrewFiPurchase: amount must be greater than zero");
        require(address(this).balance >= amount, "BrewFiPurchase: insufficient AVAX balance");
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "BrewFiPurchase: AVAX transfer failed");
        emit FundsWithdrawn(address(0), amount);
    }

    /**
     * @dev Withdraw all AVAX tokens (owner only)
     */
    function withdrawAllAVAX() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "BrewFiPurchase: no AVAX to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "BrewFiPurchase: AVAX transfer failed");
        emit FundsWithdrawn(address(0), balance);
    }

    /**
     * @dev Withdraw USDT tokens (owner only)
     * @param amount Amount to withdraw
     */
    function withdrawUSDT(uint256 amount) external onlyOwner {
        require(amount > 0, "BrewFiPurchase: amount must be greater than zero");
        require(usdtToken.balanceOf(address(this)) >= amount, "BrewFiPurchase: insufficient USDT balance");
        
        usdtToken.safeTransfer(owner(), amount);
        emit FundsWithdrawn(address(usdtToken), amount);
    }

    /**
     * @dev Withdraw all USDT tokens (owner only)
     */
    function withdrawAllUSDT() external onlyOwner {
        uint256 balance = usdtToken.balanceOf(address(this));
        require(balance > 0, "BrewFiPurchase: no USDT to withdraw");
        usdtToken.safeTransfer(owner(), balance);
        emit FundsWithdrawn(address(usdtToken), balance);
    }

    /**
     * @dev Fund contract with BREWFI tokens (owner only)
     * @param amount Amount to fund
     */
    function fundContract(uint256 amount) external onlyOwner {
        require(amount > 0, "BrewFiPurchase: amount must be greater than zero");
        brewfiToken.safeTransferFrom(owner(), address(this), amount);
        emit ContractFunded(address(brewfiToken), amount);
    }

    /**
     * @dev Pause contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get contract balances
     * @return brewfiBalance BREWFI balance
     * @return usdcBalance USDC balance
     * @return usdtBalance USDT balance
     * @return avaxBalance AVAX balance
     */
    function getBalances() external view returns (uint256 brewfiBalance, uint256 usdcBalance, uint256 usdtBalance, uint256 avaxBalance) {
        brewfiBalance = brewfiToken.balanceOf(address(this));
        usdcBalance = usdcToken.balanceOf(address(this));
        usdtBalance = usdtToken.balanceOf(address(this));
        avaxBalance = address(this).balance;
    }

    // Allow contract to receive AVAX
    receive() external payable {}
}
