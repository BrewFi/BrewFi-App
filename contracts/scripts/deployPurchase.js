const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting BrewFi Purchase Contract deployment...\n");

    // Get the deployer account
    const signers = await hre.ethers.getSigners();
    if (signers.length === 0) {
        throw new Error("No accounts found. Please configure PRIVATE_KEY in your .env file.");
    }
    
    const [deployer] = signers;
    console.log("📋 Deployer account:", deployer.address);
    
    // Check deployer balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "AVAX");
    
    if (balance < hre.ethers.parseEther("0.1")) {
        console.log("⚠️  WARNING: Low AVAX balance. You may need testnet tokens from a faucet.");
        console.log("   Get free testnet AVAX at: https://faucet.avalanche.network/\n");
    }

    // Load products configuration
    const productsConfigPath = path.join(__dirname, "..", "products-config.json");
    const productsConfig = JSON.parse(fs.readFileSync(productsConfigPath, "utf8"));
    console.log("📦 Products to add:", productsConfig.products.length);

    // Fuji testnet addresses
    const USDC_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65"; // USDC on Fuji
    const USDT_ADDRESS = "0x9a01bf917477dD9F5D715D188618fc8B7350cd22"; // USDT on Fuji (Tether USD)
    const AVAX_USD_PRICE_FEED = "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD"; // AVAX/USD on Fuji
    const BREWFI_TOKEN_ADDRESS = "0x9a13d88490e21809Fac732C18ff13EB4849e4630"; // BREWFI token address

    console.log("🏦 USDC Address:", USDC_ADDRESS);
    console.log("🏦 USDT Address:", USDT_ADDRESS);
    console.log("📊 AVAX/USD Price Feed:", AVAX_USD_PRICE_FEED);
    console.log("📊 BREWFI Token Address:", BREWFI_TOKEN_ADDRESS);
    // Deploy BrewFiPurchase contract
    console.log("\n📦 Deploying BrewFiPurchase contract...");
    const BrewFiPurchase = await hre.ethers.getContractFactory("BrewFiPurchase");
    
    const brewFiPurchase = await BrewFiPurchase.deploy(
        BREWFI_TOKEN_ADDRESS, // BREWFI token address
        USDC_ADDRESS, // USDC token address
        USDT_ADDRESS, // USDT token address
        AVAX_USD_PRICE_FEED, // AVAX/USD price feed
        deployer.address // owner
    );

    await brewFiPurchase.waitForDeployment();
    const purchaseContractAddress = await brewFiPurchase.getAddress();

    console.log("✅ BrewFiPurchase deployed successfully!");
    console.log("📍 Contract Address:", purchaseContractAddress);

    // Add products to the contract
    console.log("\n📦 Adding products to contract...");
    for (let i = 0; i < productsConfig.products.length; i++) {
        const product = productsConfig.products[i];
        console.log(`   Adding product ${i + 1}: ${product.name} - $${(parseInt(product.priceUSD) / 1e6).toFixed(2)} (${(parseInt(product.rewardRatio) / 1e18).toFixed(1)}x reward)`);
        
        const tx = await brewFiPurchase.addProduct(
            product.name,
            product.priceUSD,
            product.rewardRatio
        );
        await tx.wait();
    }

    console.log("✅ All products added successfully!");

    // Get contract balances
    const balances = await brewFiPurchase.getBalances();
    console.log("\n💰 Contract Balances:");
    console.log("   BREWFI:", hre.ethers.formatEther(balances.brewfiBalance), "BREWFI");
    console.log("   USDC:", hre.ethers.formatUnits(balances.usdcBalance, 6), "USDC");
    console.log("   AVAX:", hre.ethers.formatEther(balances.avaxBalance), "AVAX");

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment information
    const deploymentInfo = {
        contractName: "BrewFiPurchase",
        contractAddress: purchaseContractAddress,
        deployer: deployer.address,
        network: "fuji",
        timestamp: new Date().toISOString(),
        brewfiTokenAddress: BREWFI_TOKEN_ADDRESS,
        usdcTokenAddress: USDC_ADDRESS,
        usdtTokenAddress: USDT_ADDRESS,
        avaxUsdPriceFeed: AVAX_USD_PRICE_FEED,
        products: productsConfig.products,
        transactionHash: brewFiPurchase.deploymentTransaction().hash,
        blockNumber: await hre.ethers.provider.getBlockNumber()
    };

    // Save purchase contract deployment info
    const purchaseDeploymentPath = path.join(deploymentsDir, `purchase-deployment-${Date.now()}.json`);
    fs.writeFileSync(purchaseDeploymentPath, JSON.stringify(deploymentInfo, null, 2));

    // Update latest deployment info
    const latestDeploymentPath = path.join(deploymentsDir, "latest-deployment.json");
    const latestDeploymentInfo = {
        purchaseContract: {
            address: purchaseContractAddress,
            deploymentFile: path.basename(purchaseDeploymentPath),
            timestamp: deploymentInfo.timestamp
        }
    };
    fs.writeFileSync(latestDeploymentPath, JSON.stringify(latestDeploymentInfo, null, 2));

    console.log("\n📁 Deployment information saved:");
    console.log("   Purchase Contract:", purchaseDeploymentPath);
    console.log("   Updated Latest:", latestDeploymentPath);

    // Display contract links
    console.log("\n🔗 Contract Links:");
    console.log("   BREWFI Token:", `https://testnet.snowtrace.io/address/${BREWFI_TOKEN_ADDRESS}`);
    console.log("   Purchase Contract:", `https://testnet.snowtrace.io/address/${purchaseContractAddress}`);

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📋 Next Steps:");
    console.log("   1. Fund the purchase contract with BREWFI tokens: npm run fund:purchase");
    console.log("   2. Test the contract: npm run test:purchase");
    console.log("   3. Users can now purchase products and receive BREWFI rewards!");

    return {
        purchaseContractAddress,
        brewfiTokenAddress: BREWFI_TOKEN_ADDRESS,
        usdcTokenAddress: USDC_ADDRESS,
        avaxUsdPriceFeed: AVAX_USD_PRICE_FEED
    };
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
