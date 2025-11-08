const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Verification script for BrewFi contracts
 * Usage: npx hardhat run scripts/verify.js --network <network>
 */

async function main() {
    console.log("🔍 Starting contract verification...\n");

    // Load latest deployment info
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    const latestDeploymentPath = path.join(deploymentsDir, "latest-deployment.json");
    
    if (!fs.existsSync(latestDeploymentPath)) {
        console.error("❌ No deployment info found. Please deploy contracts first.");
        process.exit(1);
    }

    const latestDeployment = JSON.parse(fs.readFileSync(latestDeploymentPath, "utf8"));
    console.log("📋 Latest deployment info loaded");

    // Fuji testnet addresses (same as deployment)
    const USDC_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65";
    const USDT_ADDRESS = "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7"; // USDT on Fuji
    const AVAX_USD_PRICE_FEED = "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD";
    const BREWFI_TOKEN_ADDRESS = "0x9a13d88490e21809Fac732C18ff13EB4849e4630";

    // Get deployer address from latest deployment
    const deploymentFile = path.join(deploymentsDir, latestDeployment.purchaseContract.deploymentFile);
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    const deployerAddress = deploymentInfo.deployer;
    // Use USDT address from deployment info if available, otherwise use constant
    const usdtAddress = deploymentInfo.usdtTokenAddress || USDT_ADDRESS;

    console.log("🏦 Contract Addresses:");
    console.log("   BREWFI Token:", BREWFI_TOKEN_ADDRESS);
    console.log("   USDC Token:", USDC_ADDRESS);
    console.log("   USDT Token:", usdtAddress);
    console.log("   AVAX/USD Price Feed:", AVAX_USD_PRICE_FEED);
    console.log("   Deployer:", deployerAddress);

    // Verify BrewFiPurchase contract
    if (latestDeployment.purchaseContract) {
        console.log("\n📦 Verifying BrewFiPurchase contract...");
        console.log("   Contract Address:", latestDeployment.purchaseContract.address);
        
        try {
            await hre.run("verify:verify", {
                address: latestDeployment.purchaseContract.address,
                constructorArguments: [
                    BREWFI_TOKEN_ADDRESS,    // _brewfiToken
                    USDC_ADDRESS,            // _usdcToken
                    usdtAddress,             // _usdtToken
                    AVAX_USD_PRICE_FEED,     // _avaxUsdPriceFeed
                    deployerAddress          // _owner
                ],
                network: hre.network.name
            });
            
            console.log("✅ BrewFiPurchase contract verified successfully!");
            console.log("🔗 Contract URL:", `https://testnet.snowtrace.io/address/${latestDeployment.purchaseContract.address}`);
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ BrewFiPurchase contract is already verified!");
            } else {
                console.error("❌ Failed to verify BrewFiPurchase contract:", error.message);
            }
        }
    }

    // Verify BREWFI Token contract (if deployed)
    if (latestDeployment.brewfiToken) {
        console.log("\n🪙 Verifying BREWFI Token contract...");
        console.log("   Contract Address:", latestDeployment.brewfiToken.address);
        
        try {
            await hre.run("verify:verify", {
                address: latestDeployment.brewfiToken.address,
                constructorArguments: [
                    "BrewFi Token",          // name
                    "BREWFI",               // symbol
                    hre.ethers.parseEther("1000000"), // initialSupply (1M tokens)
                    deployerAddress         // owner
                ],
                network: hre.network.name
            });
            
            console.log("✅ BREWFI Token contract verified successfully!");
            console.log("🔗 Contract URL:", `https://testnet.snowtrace.io/address/${latestDeployment.brewfiToken.address}`);
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ BREWFI Token contract is already verified!");
            } else {
                console.error("❌ Failed to verify BREWFI Token contract:", error.message);
            }
        }
    }

    console.log("\n🎉 Verification process completed!");
    console.log("\n📋 Verified Contracts:");
    if (latestDeployment.purchaseContract) {
        console.log(`   ✅ BrewFiPurchase: ${latestDeployment.purchaseContract.address}`);
    }
    if (latestDeployment.brewfiToken) {
        console.log(`   ✅ BREWFI Token: ${latestDeployment.brewfiToken.address}`);
    }
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    });
