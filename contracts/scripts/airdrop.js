const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🎁 Starting BREWFI Token Airdrop...\n");

  // Load latest deployment info
  const latestDeploymentFile = path.join(__dirname, "../deployments/latest-deployment.json");
  
  if (!fs.existsSync(latestDeploymentFile)) {
    console.error("❌ No deployment found. Please deploy the contract first.");
    console.log("   Run: npm run deploy:fuji");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(latestDeploymentFile, "utf8"));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("📍 Using contract address:", contractAddress);
  console.log("🌐 Network:", deploymentInfo.network, "\n");

  // Load airdrop list
  const airdropListFile = path.join(__dirname, "../airdrop-list.json");
  
  if (!fs.existsSync(airdropListFile)) {
    console.error("❌ airdrop-list.json not found.");
    console.log("   Please create airdrop-list.json with recipients.");
    console.log("   Use airdrop-list.json.example as a template.");
    process.exit(1);
  }

  const airdropData = JSON.parse(fs.readFileSync(airdropListFile, "utf8"));
  const recipients = airdropData.recipients;

  if (!recipients || recipients.length === 0) {
    console.error("❌ No recipients found in airdrop-list.json");
    process.exit(1);
  }

  console.log(`📋 Found ${recipients.length} recipients to airdrop\n`);

  // Connect to contract
  const [owner] = await hre.ethers.getSigners();
  console.log("👤 Airdropping from:", owner.address);
  
  const balance = await hre.ethers.provider.getBalance(owner.address);
  console.log("💰 AVAX balance:", hre.ethers.formatEther(balance), "AVAX\n");

  if (balance < hre.ethers.parseEther("0.01")) {
    console.log("⚠️  WARNING: Low AVAX balance. You may need testnet tokens.");
    console.log("   Get free testnet AVAX at: https://faucet.avalanche.network/\n");
  }

  // Load contract ABI
  const contractArtifact = await hre.artifacts.readArtifact("BrewFiToken");
  const contract = new hre.ethers.Contract(contractAddress, contractArtifact.abi, owner);

  // Check owner's token balance
  const ownerBalance = await contract.balanceOf(owner.address);
  console.log("🍺 BREWFI Balance:", hre.ethers.formatEther(ownerBalance), "BREWFI\n");

  // Prepare recipients and amounts arrays
  const recipientsArray = recipients.map(r => r.address);
  const amountsArray = recipients.map(r => 
    hre.ethers.parseUnits(r.amount, 18)
  );

  // Calculate total amount
  const totalAmount = amountsArray.reduce((sum, amount) => sum + amount, 0n);
  console.log("📊 Total airdrop amount:", hre.ethers.formatEther(totalAmount), "BREWFI");

  if (ownerBalance < totalAmount) {
    console.error("❌ Insufficient token balance for airdrop");
    console.log("   Required:", hre.ethers.formatEther(totalAmount), "BREWFI");
    console.log("   Available:", hre.ethers.formatEther(ownerBalance), "BREWFI");
    process.exit(1);
  }

  console.log("\n⏳ Executing batch airdrop...");
  
  // Execute airdrop
  try {
    const tx = await contract.batchAirdrop(recipientsArray, amountsArray);
    console.log("📤 Transaction submitted:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("   Block:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());

    console.log("\n🎉 Airdrop completed successfully!");
    console.log(`   Recipients: ${recipients.length}`);
    console.log(`   Total amount: ${hre.ethers.formatEther(totalAmount)} BREWFI`);
    console.log("\n🔗 View transaction:");
    console.log(`   https://testnet.snowtrace.io/tx/${tx.hash}`);

  } catch (error) {
    console.error("❌ Airdrop failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

