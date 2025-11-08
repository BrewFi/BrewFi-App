const hre = require("hardhat");

/**
 * Manual verification script for individual contracts
 * Usage: npx hardhat run scripts/verifyManual.js --network <network>
 * 
 * Edit the contract addresses and constructor arguments below as needed
 */

async function main() {
    console.log("🔍 Manual Contract Verification\n");

    // ===========================================
    // CONFIGURATION - Edit these values as needed
    // ===========================================
    
    // Contract addresses to verify
    const CONTRACTS = {
        // BrewFiPurchase contract
        purchaseContract: {
            address: "0x194eC920B6d7e887F63e2Ea77ca743bAEE9b94fd", // Replace with your contract address
            constructorArgs: [
                "0x9a13d88490e21809Fac732C18ff13EB4849e4630", // BREWFI token address
                "0x5425890298aed601595a70AB815c96711a31Bc65", // USDC token address
                "0x9a01bf917477dD9F5D715D188618fc8B7350cd22", // USDT token address
                "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD", // AVAX/USD price feed
                "0x22557E1382659A8EdAffE981fc69b7bEf731e386"  // Owner address
            ]
        },
        
        // BREWFI Token contract (if you have one)
        brewfiToken: {
            address: "0x9a13d88490e21809Fac732C18ff13EB4849e4630", // Replace with your token address
            constructorArgs: [
                "BrewFi Token",          // name
                "BREWFI",               // symbol
                hre.ethers.parseEther("1000000"), // initialSupply (1M tokens)
                "0x22557E1382659A8EdAffE981fc69b7bEf731e386"  // owner
            ]
        }
    };

    // ===========================================
    // VERIFICATION PROCESS
    // ===========================================

    for (const [contractName, contractInfo] of Object.entries(CONTRACTS)) {
        if (!contractInfo.address || contractInfo.address === "0x0000000000000000000000000000000000000000") {
            console.log(`⏭️  Skipping ${contractName} - no address provided`);
            continue;
        }

        console.log(`\n📦 Verifying ${contractName}...`);
        console.log(`   Address: ${contractInfo.address}`);
        console.log(`   Constructor Args: ${contractInfo.constructorArgs.length} parameters`);

        try {
            await hre.run("verify:verify", {
                address: contractInfo.address,
                constructorArguments: contractInfo.constructorArgs,
                network: hre.network.name
            });
            
            console.log(`✅ ${contractName} verified successfully!`);
            
            // Generate explorer URL
            const explorerUrl = hre.network.name === "snowtrace" || hre.network.name === "fuji" 
                ? `https://testnet.snowtrace.io/address/${contractInfo.address}`
                : `https://etherscan.io/address/${contractInfo.address}`;
            
            console.log(`🔗 Explorer URL: ${explorerUrl}`);
            
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log(`✅ ${contractName} is already verified!`);
            } else {
                console.error(`❌ Failed to verify ${contractName}:`, error.message);
            }
        }
    }

    console.log("\n🎉 Manual verification completed!");
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    });
