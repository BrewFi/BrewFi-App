const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying BrewFi Token to Avalanche Fuji Testnet...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "AVAX\n");

  if (balance < hre.ethers.parseEther("0.1")) {
    console.log("⚠️  WARNING: Low AVAX balance. You may need testnet tokens from a faucet.");
    console.log("   Get free testnet AVAX at: https://faucet.avalanche.network/\n");
  }

  // Deploy contract
  const BrewFiToken = await hre.ethers.getContractFactory("BrewFiToken");
  console.log("⏳ Deploying BrewFiToken...");
  
  const brewFiToken = await BrewFiToken.deploy(deployer.address);
  await brewFiToken.waitForDeployment();

  const contractAddress = await brewFiToken.getAddress();
  console.log("\n✅ BREWFI Token deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 View on Snowtrace:", `https://testnet.snowtrace.io/address/${contractAddress}\n`);

  // Get deployment transaction
  const deploymentTx = brewFiToken.deploymentTransaction();
  if (deploymentTx) {
    console.log("📋 Deployment Transaction:", deploymentTx.hash);
    console.log("   Network: Avalanche Fuji Testnet");
  }

  // Save deployment info
  const deploymentInfo = {
    network: "Avalanche Fuji Testnet",
    networkId: 43113,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTx: deploymentTx?.hash || "",
    blockNumber: (await hre.ethers.provider.getBlockNumber()).toString(),
    timestamp: new Date().toISOString(),
    tokenName: "BrewFi Token",
    symbol: "BREWFI",
    totalSupply: "10,000,000",
    decimals: 18
  };

  // Ensure deployments directory exists
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `deployment-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile);

  // Also save to latest deployment
  const latestDeploymentFile = path.join(deploymentsDir, "latest-deployment.json");
  fs.writeFileSync(latestDeploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Latest deployment info saved to:", latestDeploymentFile);

  console.log("\n🎉 Deployment complete!");
  console.log("\n📝 Next steps:");
  console.log("   1. Verify contract on Snowtrace (optional)");
  console.log("   2. Configure airdrop recipients in airdrop-list.json");
  console.log("   3. Run airdrop: npm run airdrop");
  console.log("\n🎊 Happy deploying!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

