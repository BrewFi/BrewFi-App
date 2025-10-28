const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("💰 Starting BrewFi Purchase Contract funding...\n");

    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📋 Account:", deployer.address);
    
    // Check AVAX balance
    const avaxBalance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 AVAX Balance:", hre.ethers.formatEther(avaxBalance), "AVAX");

    // Load deployment information
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    const latestDeploymentPath = path.join(deploymentsDir, "latest-deployment.json");
    
    if (!fs.existsSync(latestDeploymentPath)) {
        throw new Error("❌ No deployment found. Please deploy contracts first using 'npm run deploy:purchase'");
    }

    const deployment = JSON.parse(fs.readFileSync(latestDeploymentPath, "utf8"));
    
    if (!deployment.purchaseContract) {
        throw new Error("❌ No purchase contract deployment found. Please deploy the purchase contract first using 'npm run deploy:purchase'");
    }

    const brewfiTokenAddress = deployment.contractAddress;
    const purchaseContractAddress = deployment.purchaseContract.address;

    console.log("🔗 BREWFI Token Address:", brewfiTokenAddress);
    console.log("🛒 Purchase Contract Address:", purchaseContractAddress);

    // Get contract instances
    const brewfiToken = await hre.ethers.getContractAt("BrewFiToken", brewfiTokenAddress);
    const purchaseContract = await hre.ethers.getContractAt("BrewFiPurchase", purchaseContractAddress);

    // Check BREWFI balance
    const brewfiBalance = await brewfiToken.balanceOf(deployer.address);
    console.log("🪙 BREWFI Balance:", hre.ethers.formatEther(brewfiBalance), "BREWFI");

    if (brewfiBalance === 0n) {
        throw new Error("❌ No BREWFI tokens available. Please ensure you have BREWFI tokens to fund the contract.");
    }

    // Get current contract balances
    const contractBalances = await purchaseContract.getBalances();
    console.log("\n📊 Current Contract Balances:");
    console.log("   BREWFI:", hre.ethers.formatEther(contractBalances.brewfiBalance), "BREWFI");
    console.log("   USDC:", hre.ethers.formatUnits(contractBalances.usdcBalance, 6), "USDC");
    console.log("   AVAX:", hre.ethers.formatEther(contractBalances.avaxBalance), "AVAX");

    // Calculate funding amount
    // Fund with 50% of available BREWFI tokens, minimum 1000 tokens
    const fundingAmount = brewfiBalance > hre.ethers.parseEther("2000") 
        ? brewfiBalance / 2n 
        : brewfiBalance;

    console.log("\n💸 Funding Amount:", hre.ethers.formatEther(fundingAmount), "BREWFI");

    // Approve spending
    console.log("🔐 Approving BREWFI spending...");
    const approveTx = await brewfiToken.approve(purchaseContractAddress, fundingAmount);
    await approveTx.wait();
    console.log("✅ Approval confirmed");

    // Fund the contract
    console.log("💰 Funding purchase contract...");
    const fundTx = await purchaseContract.fundContract(fundingAmount);
    const fundReceipt = await fundTx.wait();
    console.log("✅ Funding transaction confirmed");
    console.log("📋 Transaction Hash:", fundReceipt.hash);

    // Verify funding
    const newContractBalances = await purchaseContract.getBalances();
    console.log("\n📊 Updated Contract Balances:");
    console.log("   BREWFI:", hre.ethers.formatEther(newContractBalances.brewfiBalance), "BREWFI");
    console.log("   USDC:", hre.ethers.formatUnits(newContractBalances.usdcBalance, 6), "USDC");
    console.log("   AVAX:", hre.ethers.formatEther(newContractBalances.avaxBalance), "AVAX");

    // Calculate how many purchases can be made
    const products = await purchaseContract.getAllProducts();
    console.log("\n📦 Available Products:");
    
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const priceUSD = parseFloat(hre.ethers.formatUnits(product.priceUSD, 6));
        const rewardRatio = parseFloat(hre.ethers.formatEther(product.rewardRatio));
        const brewfiReward = priceUSD * rewardRatio;
        const maxPurchases = Math.floor(parseFloat(hre.ethers.formatEther(newContractBalances.brewfiBalance)) / brewfiReward);
        
        console.log(`   ${i}: ${product.name} - $${priceUSD.toFixed(2)} (${rewardRatio.toFixed(1)}x = ${brewfiReward.toFixed(2)} BREWFI) - Max: ${maxPurchases} purchases`);
    }

    console.log("\n🎉 Contract funding completed successfully!");
    console.log("\n📋 Next Steps:");
    console.log("   1. Test purchases: npm run test:purchase");
    console.log("   2. Users can now buy products and receive BREWFI rewards!");
    console.log("   3. Monitor contract balances and refill as needed");

    console.log("\n🔗 Contract Links:");
    console.log("   Purchase Contract:", `https://testnet.snowtrace.io/address/${purchaseContractAddress}`);
    console.log("   Funding Transaction:", `https://testnet.snowtrace.io/tx/${fundReceipt.hash}`);

    return {
        fundingAmount: fundingAmount.toString(),
        transactionHash: fundReceipt.hash,
        contractBalances: {
            brewfi: newContractBalances.brewfiBalance.toString(),
            usdc: newContractBalances.usdcBalance.toString(),
            avax: newContractBalances.avaxBalance.toString()
        }
    };
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Funding failed:", error);
        process.exit(1);
    });
