const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BrewFiPurchase", function () {
    let brewfiToken;
    let usdcToken;
    let usdtToken;
    let purchaseContract;
    let owner;
    let buyer;
    let otherAccount;
    let avaxUsdPriceFeed;

    // Test addresses (mock contracts for testing)
    const USDC_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65";
    const AVAX_USD_PRICE_FEED = "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD";

    beforeEach(async function () {
        [owner, buyer, otherAccount] = await ethers.getSigners();

        // Deploy mock USDC token
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        usdcToken = await MockERC20.deploy("USD Coin", "USDC", 6);
        await usdcToken.waitForDeployment();

        // Deploy mock USDT token
        usdtToken = await MockERC20.deploy("Tether USD", "USDT", 6);
        await usdtToken.waitForDeployment();

        // Deploy BREWFI token
        const BrewFiToken = await ethers.getContractFactory("BrewFiToken");
        brewfiToken = await BrewFiToken.deploy(owner.address);
        await brewfiToken.waitForDeployment();

        // Deploy mock price feed
        const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
        avaxUsdPriceFeed = await MockPriceFeed.deploy();
        await avaxUsdPriceFeed.waitForDeployment();

        // Deploy purchase contract
        const BrewFiPurchase = await ethers.getContractFactory("BrewFiPurchase");
        purchaseContract = await BrewFiPurchase.deploy(
            await brewfiToken.getAddress(),
            await usdcToken.getAddress(),
            await usdtToken.getAddress(),
            await avaxUsdPriceFeed.getAddress(),
            owner.address
        );
        await purchaseContract.waitForDeployment();

        // Fund the purchase contract with BREWFI tokens
        const fundingAmount = ethers.parseEther("10000"); // 10,000 BREWFI
        await brewfiToken.transfer(await purchaseContract.getAddress(), fundingAmount);

        // Mint USDC tokens to buyer
        await usdcToken.mint(buyer.address, ethers.parseUnits("1000", 6)); // 1000 USDC

        // Mint USDT tokens to buyer
        await usdtToken.mint(buyer.address, ethers.parseUnits("1000", 6)); // 1000 USDT
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await purchaseContract.owner()).to.equal(owner.address);
        });

        it("Should set the correct token addresses", async function () {
            expect(await purchaseContract.brewfiToken()).to.equal(await brewfiToken.getAddress());
            expect(await purchaseContract.usdcToken()).to.equal(await usdcToken.getAddress());
            expect(await purchaseContract.usdtToken()).to.equal(await usdtToken.getAddress());
        });

        it("Should have correct precision constants", async function () {
            expect(await purchaseContract.USD_PRECISION()).to.equal(ethers.parseUnits("1", 6));
            expect(await purchaseContract.REWARD_PRECISION()).to.equal(ethers.parseEther("1"));
            expect(await purchaseContract.PRICE_FEED_PRECISION()).to.equal(ethers.parseUnits("1", 8));
        });
    });

    describe("Product Management", function () {
        it("Should add a product", async function () {
            const tx = await purchaseContract.addProduct("Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1"));
            await tx.wait();

            const product = await purchaseContract.getProduct(0);
            expect(product.name).to.equal("Coffee");
            expect(product.priceUSD).to.equal(ethers.parseUnits("5", 6));
            expect(product.rewardRatio).to.equal(ethers.parseEther("1"));
            expect(product.active).to.be.true;
        });

        it("Should update a product", async function () {
            await purchaseContract.addProduct("Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1"));
            
            const tx = await purchaseContract.updateProduct(0, "Premium Coffee", ethers.parseUnits("7", 6), ethers.parseEther("1.5"));
            await tx.wait();

            const product = await purchaseContract.getProduct(0);
            expect(product.name).to.equal("Premium Coffee");
            expect(product.priceUSD).to.equal(ethers.parseUnits("7", 6));
            expect(product.rewardRatio).to.equal(ethers.parseEther("1.5"));
        });

        it("Should toggle product active status", async function () {
            await purchaseContract.addProduct("Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1"));
            
            let product = await purchaseContract.getProduct(0);
            expect(product.active).to.be.true;

            const tx = await purchaseContract.toggleProduct(0);
            const receipt = await tx.wait();
            product = await purchaseContract.getProduct(0);
            expect(product.active).to.be.false;
            
            // Check that ProductToggled event was emitted
            const event = receipt.logs.find(log => {
                try {
                    const parsed = purchaseContract.interface.parseLog(log);
                    return parsed.name === "ProductToggled";
                } catch {
                    return false;
                }
            });
            expect(event).to.not.be.undefined;

            await purchaseContract.toggleProduct(0);
            product = await purchaseContract.getProduct(0);
            expect(product.active).to.be.true;
        });

        it("Should revert when adding product with zero price", async function () {
            await expect(
                purchaseContract.addProduct("Coffee", 0, ethers.parseEther("1"))
            ).to.be.revertedWith("BrewFiPurchase: price must be greater than zero");
        });

        it("Should revert when adding product with zero reward ratio", async function () {
            await expect(
                purchaseContract.addProduct("Coffee", ethers.parseUnits("5", 6), 0)
            ).to.be.revertedWith("BrewFiPurchase: reward ratio must be greater than zero");
        });

        it("Should revert when non-owner tries to add product", async function () {
            await expect(
                purchaseContract.connect(buyer).addProduct("Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1"))
            ).to.be.revertedWithCustomError(purchaseContract, "OwnableUnauthorizedAccount");
        });

        it("Should revert when adding product exceeds max price", async function () {
            const maxPrice = await purchaseContract.MAX_PRICE_USD();
            await expect(
                purchaseContract.addProduct("Expensive", maxPrice + 1n, ethers.parseEther("1"))
            ).to.be.revertedWith("BrewFiPurchase: price exceeds maximum");
        });

        it("Should revert when adding product exceeds max reward ratio", async function () {
            const maxRatio = await purchaseContract.MAX_REWARD_RATIO();
            await expect(
                purchaseContract.addProduct("High Reward", ethers.parseUnits("5", 6), maxRatio + 1n)
            ).to.be.revertedWith("BrewFiPurchase: reward ratio exceeds maximum");
        });
    });

    describe("USDT Purchases", function () {
        beforeEach(async function () {
            await purchaseContract.addProduct("Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1"));
        });

        it("Should purchase product with USDT", async function () {
            const productId = 0;
            const usdtAmount = ethers.parseUnits("5", 6);
            const expectedReward = ethers.parseEther("5"); // 5 USD * 1.0 ratio = 5 BREWFI

            const buyerBalanceBefore = await brewfiToken.balanceOf(buyer.address);
            const contractBalanceBefore = await brewfiToken.balanceOf(await purchaseContract.getAddress());

            // Approve USDT spending
            await usdtToken.connect(buyer).approve(await purchaseContract.getAddress(), usdtAmount);

            // Purchase product
            const tx = await purchaseContract.connect(buyer).purchaseWithUSDT(productId);
            await tx.wait();

            const buyerBalanceAfter = await brewfiToken.balanceOf(buyer.address);
            const contractBalanceAfter = await brewfiToken.balanceOf(await purchaseContract.getAddress());

            expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(expectedReward);
            expect(contractBalanceBefore - contractBalanceAfter).to.equal(expectedReward);
        });

        it("Should revert when purchasing inactive product with USDT", async function () {
            await purchaseContract.toggleProduct(0);
            
            await usdtToken.connect(buyer).approve(await purchaseContract.getAddress(), ethers.parseUnits("5", 6));
            
            await expect(
                purchaseContract.connect(buyer).purchaseWithUSDT(0)
            ).to.be.revertedWith("BrewFiPurchase: product is not active");
        });
    });

    describe("USDC Purchases", function () {
        beforeEach(async function () {
            await purchaseContract.addProduct("Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1"));
        });

        it("Should purchase product with USDC", async function () {
            const productId = 0;
            const usdcAmount = ethers.parseUnits("5", 6);
            const expectedReward = ethers.parseEther("5"); // 5 USD * 1.0 ratio = 5 BREWFI

            const buyerBalanceBefore = await brewfiToken.balanceOf(buyer.address);
            const contractBalanceBefore = await brewfiToken.balanceOf(await purchaseContract.getAddress());

            // Approve USDC spending
            await usdcToken.connect(buyer).approve(await purchaseContract.getAddress(), usdcAmount);

            // Purchase product
            const tx = await purchaseContract.connect(buyer).purchaseWithUSDC(productId);
            await tx.wait();

            const buyerBalanceAfter = await brewfiToken.balanceOf(buyer.address);
            const contractBalanceAfter = await brewfiToken.balanceOf(await purchaseContract.getAddress());

            expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(expectedReward);
            expect(contractBalanceBefore - contractBalanceAfter).to.equal(expectedReward);
        });

        it("Should purchase product with custom reward ratio", async function () {
            await purchaseContract.addProduct("Premium Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1.5"));
            
            const productId = 1;
            const usdcAmount = ethers.parseUnits("5", 6);
            const expectedReward = ethers.parseEther("7.5"); // 5 USD * 1.5 ratio = 7.5 BREWFI

            await usdcToken.connect(buyer).approve(await purchaseContract.getAddress(), usdcAmount);
            
            const tx = await purchaseContract.connect(buyer).purchaseWithUSDC(productId);
            await tx.wait();

            const buyerBalance = await brewfiToken.balanceOf(buyer.address);
            expect(buyerBalance).to.equal(expectedReward);
        });

        it("Should revert when purchasing inactive product", async function () {
            await purchaseContract.toggleProduct(0);
            
            await usdcToken.connect(buyer).approve(await purchaseContract.getAddress(), ethers.parseUnits("5", 6));
            
            await expect(
                purchaseContract.connect(buyer).purchaseWithUSDC(0)
            ).to.be.revertedWith("BrewFiPurchase: product is not active");
        });

        it("Should revert when contract has insufficient BREWFI", async function () {
            // Create a new purchase contract with no BREWFI funding
            const BrewFiPurchase = await ethers.getContractFactory("BrewFiPurchase");
            const emptyPurchaseContract = await BrewFiPurchase.deploy(
                await brewfiToken.getAddress(),
                await usdcToken.getAddress(),
                await usdtToken.getAddress(),
                await avaxUsdPriceFeed.getAddress(),
                owner.address
            );
            await emptyPurchaseContract.waitForDeployment();
            
            // Add product to empty contract
            await emptyPurchaseContract.addProduct("Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1"));

            await usdcToken.connect(buyer).approve(await emptyPurchaseContract.getAddress(), ethers.parseUnits("5", 6));
            
            await expect(
                emptyPurchaseContract.connect(buyer).purchaseWithUSDC(0)
            ).to.be.revertedWith("BrewFiPurchase: insufficient BREWFI balance");
        });
    });

    describe("AVAX Purchases", function () {
        beforeEach(async function () {
            await purchaseContract.addProduct("Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1"));
            // Set mock price feed to $20 AVAX/USD
            await avaxUsdPriceFeed.setPrice(ethers.parseUnits("20", 8));
        });

        it("Should purchase product with AVAX", async function () {
            const productId = 0;
            const avaxPrice = ethers.parseUnits("20", 8); // $20 per AVAX
            const requiredAvax = ethers.parseUnits("5", 6) * ethers.parseUnits("1", 8) / avaxPrice; // 5 USD / 20 USD/AVAX = 0.25 AVAX
            const expectedReward = ethers.parseEther("5"); // 5 USD * 1.0 ratio = 5 BREWFI
            const minBrewfiReward = expectedReward - ethers.parseEther("0.1"); // Allow some slippage

            const buyerBalanceBefore = await brewfiToken.balanceOf(buyer.address);
            const contractBalanceBefore = await brewfiToken.balanceOf(await purchaseContract.getAddress());

            const tx = await purchaseContract.connect(buyer).purchaseWithAVAX(productId, minBrewfiReward, { value: requiredAvax });
            await tx.wait();

            const buyerBalanceAfter = await brewfiToken.balanceOf(buyer.address);
            const contractBalanceAfter = await brewfiToken.balanceOf(await purchaseContract.getAddress());

            expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(expectedReward);
            expect(contractBalanceBefore - contractBalanceAfter).to.equal(expectedReward);
        });

        it("Should refund excess AVAX", async function () {
            const productId = 0;
            const avaxPrice = ethers.parseUnits("20", 8);
            const requiredAvax = ethers.parseUnits("5", 6) * ethers.parseUnits("1", 8) / avaxPrice;
            const excessAvax = ethers.parseEther("0.1");
            const totalAvax = requiredAvax + excessAvax;
            const expectedReward = ethers.parseEther("5");
            const minBrewfiReward = expectedReward - ethers.parseEther("0.1");

            const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

            const tx = await purchaseContract.connect(buyer).purchaseWithAVAX(productId, minBrewfiReward, { value: totalAvax });
            const receipt = await tx.wait();

            const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            const expectedBalance = buyerBalanceBefore - totalAvax + excessAvax - gasUsed;

            expect(buyerBalanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
        });

        it("Should revert when insufficient AVAX amount", async function () {
            const productId = 0;
            const avaxPrice = ethers.parseUnits("20", 8); // $20 per AVAX
            const requiredAvax = ethers.parseUnits("5", 6) * ethers.parseUnits("1", 8) / avaxPrice; // 5 USD / 20 USD/AVAX = 0.25 AVAX
            const insufficientAvax = requiredAvax / 2n; // Half of required amount
            const minBrewfiReward = ethers.parseEther("4");

            await expect(
                purchaseContract.connect(buyer).purchaseWithAVAX(productId, minBrewfiReward, { value: insufficientAvax })
            ).to.be.revertedWith("BrewFiPurchase: insufficient AVAX amount");
        });

        it("Should revert when slippage is too high", async function () {
            const productId = 0;
            const avaxPrice = ethers.parseUnits("20", 8);
            const requiredAvax = ethers.parseUnits("5", 6) * ethers.parseUnits("1", 8) / avaxPrice;
            const expectedReward = ethers.parseEther("5");
            const minBrewfiReward = expectedReward + ethers.parseEther("1"); // Too high minimum

            await expect(
                purchaseContract.connect(buyer).purchaseWithAVAX(productId, minBrewfiReward, { value: requiredAvax })
            ).to.be.revertedWith("BrewFiPurchase: slippage too high");
        });
    });

    describe("Reward Calculation", function () {
        it("Should calculate correct reward for 1.0x ratio", async function () {
            const priceUSD = ethers.parseUnits("5", 6);
            const rewardRatio = ethers.parseEther("1");
            const expectedReward = ethers.parseEther("5");

            const calculatedReward = await purchaseContract.calculateBrewfiReward(priceUSD, rewardRatio);
            expect(calculatedReward).to.equal(expectedReward);
        });

        it("Should calculate correct reward for 1.5x ratio", async function () {
            const priceUSD = ethers.parseUnits("5", 6);
            const rewardRatio = ethers.parseEther("1.5");
            const expectedReward = ethers.parseEther("7.5");

            const calculatedReward = await purchaseContract.calculateBrewfiReward(priceUSD, rewardRatio);
            expect(calculatedReward).to.equal(expectedReward);
        });

        it("Should calculate correct reward for 0.5x ratio", async function () {
            const priceUSD = ethers.parseUnits("5", 6);
            const rewardRatio = ethers.parseEther("0.5");
            const expectedReward = ethers.parseEther("2.5");

            const calculatedReward = await purchaseContract.calculateBrewfiReward(priceUSD, rewardRatio);
            expect(calculatedReward).to.equal(expectedReward);
        });
    });

    describe("Owner Functions", function () {
        beforeEach(async function () {
            await purchaseContract.addProduct("Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1"));
        });

        it("Should withdraw USDC", async function () {
            // Mint USDC to contract
            await usdcToken.mint(await purchaseContract.getAddress(), ethers.parseUnits("100", 6));
            
            const withdrawAmount = ethers.parseUnits("50", 6);
            const ownerBalanceBefore = await usdcToken.balanceOf(owner.address);

            await purchaseContract.withdrawUSDC(withdrawAmount);

            const ownerBalanceAfter = await usdcToken.balanceOf(owner.address);
            expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(withdrawAmount);
        });

        it("Should withdraw AVAX", async function () {
            // Send AVAX to contract
            await owner.sendTransaction({
                to: await purchaseContract.getAddress(),
                value: ethers.parseEther("1")
            });

            const withdrawAmount = ethers.parseEther("0.5");
            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

            const tx = await purchaseContract.withdrawAVAX(withdrawAmount);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
            expect(ownerBalanceAfter - ownerBalanceBefore + gasUsed).to.equal(withdrawAmount);
        });

        it("Should withdraw all AVAX", async function () {
            const avaxAmount = ethers.parseEther("1");
            await owner.sendTransaction({
                to: await purchaseContract.getAddress(),
                value: avaxAmount
            });

            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

            const tx = await purchaseContract.withdrawAllAVAX();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
            expect(ownerBalanceAfter - ownerBalanceBefore + gasUsed).to.equal(avaxAmount);
        });

        it("Should revert when non-owner tries to withdraw", async function () {
            await expect(
                purchaseContract.connect(buyer).withdrawUSDC(ethers.parseUnits("1", 6))
            ).to.be.revertedWithCustomError(purchaseContract, "OwnableUnauthorizedAccount");
        });
    });

    describe("Edge Cases", function () {
        it("Should revert when purchasing invalid product ID", async function () {
            await expect(
                purchaseContract.connect(buyer).purchaseWithUSDC(999)
            ).to.be.revertedWith("BrewFiPurchase: invalid product ID");
        });

        it("Should revert when purchasing with zero AVAX", async function () {
            await purchaseContract.addProduct("Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1"));
            const minBrewfiReward = ethers.parseEther("4");
            
            await expect(
                purchaseContract.connect(buyer).purchaseWithAVAX(0, minBrewfiReward, { value: 0 })
            ).to.be.revertedWith("BrewFiPurchase: AVAX amount must be greater than zero");
        });

        it("Should revert when price feed returns invalid data", async function () {
            await purchaseContract.addProduct("Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1"));
            await avaxUsdPriceFeed.setPrice(0); // Invalid price
            const minBrewfiReward = ethers.parseEther("4");

            await expect(
                purchaseContract.connect(buyer).purchaseWithAVAX(0, minBrewfiReward, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("BrewFiPurchase: invalid price feed data");
        });

        it("Should revert when price feed data is stale", async function () {
            await purchaseContract.addProduct("Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1"));
            // Set price with old timestamp (more than 1 hour ago)
            const currentTime = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
            const staleTimestamp = currentTime.timestamp - 7200; // 2 hours ago
            await avaxUsdPriceFeed.setPriceWithTimestamp(ethers.parseUnits("20", 8), staleTimestamp);
            const minBrewfiReward = ethers.parseEther("4");
            const requiredAvax = ethers.parseUnits("5", 6) * ethers.parseUnits("1", 8) / ethers.parseUnits("20", 8);

            await expect(
                purchaseContract.connect(buyer).purchaseWithAVAX(0, minBrewfiReward, { value: requiredAvax })
            ).to.be.revertedWith("BrewFiPurchase: price feed data too stale");
        });
    });

    describe("Pause Functionality", function () {
        beforeEach(async function () {
            await purchaseContract.addProduct("Coffee", ethers.parseUnits("5", 6), ethers.parseEther("1"));
        });

        it("Should pause contract", async function () {
            await purchaseContract.pause();
            expect(await purchaseContract.paused()).to.be.true;
        });

        it("Should unpause contract", async function () {
            await purchaseContract.pause();
            await purchaseContract.unpause();
            expect(await purchaseContract.paused()).to.be.false;
        });

        it("Should revert purchases when paused", async function () {
            await purchaseContract.pause();
            await usdcToken.connect(buyer).approve(await purchaseContract.getAddress(), ethers.parseUnits("5", 6));
            
            await expect(
                purchaseContract.connect(buyer).purchaseWithUSDC(0)
            ).to.be.revertedWithCustomError(purchaseContract, "EnforcedPause");
        });

        it("Should revert product management when paused", async function () {
            await purchaseContract.pause();
            
            await expect(
                purchaseContract.addProduct("New Product", ethers.parseUnits("10", 6), ethers.parseEther("1"))
            ).to.be.revertedWithCustomError(purchaseContract, "EnforcedPause");
        });

        it("Should revert when non-owner tries to pause", async function () {
            await expect(
                purchaseContract.connect(buyer).pause()
            ).to.be.revertedWithCustomError(purchaseContract, "OwnableUnauthorizedAccount");
        });
    });

    describe("Withdraw Functions", function () {
        it("Should withdraw USDT", async function () {
            // Mint USDT to contract
            await usdtToken.mint(await purchaseContract.getAddress(), ethers.parseUnits("100", 6));
            
            const withdrawAmount = ethers.parseUnits("50", 6);
            const ownerBalanceBefore = await usdtToken.balanceOf(owner.address);

            await purchaseContract.withdrawUSDT(withdrawAmount);

            const ownerBalanceAfter = await usdtToken.balanceOf(owner.address);
            expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(withdrawAmount);
        });

        it("Should withdraw all USDT", async function () {
            const usdtAmount = ethers.parseUnits("100", 6);
            await usdtToken.mint(await purchaseContract.getAddress(), usdtAmount);
            
            const ownerBalanceBefore = await usdtToken.balanceOf(owner.address);

            await purchaseContract.withdrawAllUSDT();

            const ownerBalanceAfter = await usdtToken.balanceOf(owner.address);
            expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(usdtAmount);
        });

        it("Should withdraw all USDC", async function () {
            const usdcAmount = ethers.parseUnits("100", 6);
            await usdcToken.mint(await purchaseContract.getAddress(), usdcAmount);
            
            const ownerBalanceBefore = await usdcToken.balanceOf(owner.address);

            await purchaseContract.withdrawAllUSDC();

            const ownerBalanceAfter = await usdcToken.balanceOf(owner.address);
            expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(usdcAmount);
        });
    });
});
