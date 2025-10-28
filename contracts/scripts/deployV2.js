const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying BrewFiTokenV2...");

    // Get the contract factory
    const BrewFiTokenV2 = await ethers.getContractFactory("BrewFiTokenV2");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

    // Deploy the contract
    const brewFiTokenV2 = await BrewFiTokenV2.deploy(deployer.address);
    await brewFiTokenV2.waitForDeployment();

    const tokenAddress = await brewFiTokenV2.getAddress();
    console.log("BrewFiTokenV2 deployed to:", tokenAddress);

    // Verify deployment
    console.log("\n=== Deployment Verification ===");
    console.log("Token Name:", await brewFiTokenV2.name());
    console.log("Token Symbol:", await brewFiTokenV2.symbol());
    console.log("Token Decimals:", await brewFiTokenV2.decimals());
    console.log("Total Supply:", ethers.formatEther(await brewFiTokenV2.totalSupply()), "BREWFI");
    console.log("Max Supply:", ethers.formatEther(await brewFiTokenV2.MAX_SUPPLY()), "BREWFI");
    console.log("Max Mint Amount:", ethers.formatEther(await brewFiTokenV2.maxMintAmount()), "BREWFI");
    console.log("Owner Balance:", ethers.formatEther(await brewFiTokenV2.balanceOf(deployer.address)), "BREWFI");

    // Verify roles
    console.log("\n=== Role Verification ===");
    console.log("Owner has ADMIN_ROLE:", await brewFiTokenV2.hasRole(await brewFiTokenV2.ADMIN_ROLE(), deployer.address));
    console.log("Owner has MINTER_ROLE:", await brewFiTokenV2.hasRole(await brewFiTokenV2.MINTER_ROLE(), deployer.address));
    console.log("Owner has BURNER_ROLE:", await brewFiTokenV2.hasRole(await brewFiTokenV2.BURNER_ROLE(), deployer.address));
    console.log("Owner has PAUSER_ROLE:", await brewFiTokenV2.hasRole(await brewFiTokenV2.PAUSER_ROLE(), deployer.address));
    console.log("Owner has TAX_MANAGER_ROLE:", await brewFiTokenV2.hasRole(await brewFiTokenV2.TAX_MANAGER_ROLE(), deployer.address));

    // Get contract info
    console.log("\n=== Contract Information ===");
    const contractInfo = await brewFiTokenV2.getContractInfo();
    console.log("Contract Info:", {
        name: contractInfo.tokenName,
        symbol: contractInfo.tokenSymbol,
        decimals: contractInfo.tokenDecimals,
        totalSupply: ethers.formatEther(contractInfo.currentTotalSupply),
        maxSupply: ethers.formatEther(contractInfo.maxSupply),
        taxRate: contractInfo.currentTaxRate.toString(),
        taxEnabled: contractInfo.isTaxEnabled,
        paused: contractInfo.isPaused
    });

    // Save deployment info
    const deploymentInfo = {
        network: await ethers.provider.getNetwork(),
        tokenAddress: tokenAddress,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        contractInfo: {
            name: contractInfo.tokenName,
            symbol: contractInfo.tokenSymbol,
            decimals: contractInfo.tokenDecimals,
            totalSupply: contractInfo.currentTotalSupply.toString(),
            maxSupply: contractInfo.maxSupply.toString(),
            taxRate: contractInfo.currentTaxRate.toString(),
            taxEnabled: contractInfo.isTaxEnabled,
            paused: contractInfo.isPaused
        }
    };

    console.log("\n=== Deployment Summary ===");
    console.log("Network:", deploymentInfo.network.name, "(Chain ID:", deploymentInfo.network.chainId, ")");
    console.log("Token Address:", deploymentInfo.tokenAddress);
    console.log("Deployer:", deploymentInfo.deployer);
    console.log("Deployment Time:", deploymentInfo.deploymentTime);

    // Example usage instructions
    console.log("\n=== Usage Instructions ===");
    console.log("1. To mint tokens:");
    console.log(`   await brewFiTokenV2.mint("0x...", ethers.parseEther("1000"), "Reason for minting");`);
    console.log("\n2. To burn tokens:");
    console.log(`   await brewFiTokenV2.burn(ethers.parseEther("100"), "Reason for burning");`);
    console.log("\n3. To set tax rate (5%):");
    console.log(`   await brewFiTokenV2.setTaxRate(500); // 500 basis points = 5%`);
    console.log(`   await brewFiTokenV2.setTaxWallet("0x...");`);
    console.log(`   await brewFiTokenV2.setTaxEnabled(true);`);
    console.log("\n4. To pause/unpause:");
    console.log(`   await brewFiTokenV2.pause();`);
    console.log(`   await brewFiTokenV2.unpause();`);
    console.log("\n5. To create vesting schedule:");
    console.log(`   await brewFiTokenV2.createVestingSchedule("0x...", ethers.parseEther("10000"), 0, 365*24*60*60, true);`);

    return deploymentInfo;
}

// Execute deployment
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
