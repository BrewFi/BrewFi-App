const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BrewFiTokenV2", function () {
    let brewFiTokenV2;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let taxWallet;

    const INITIAL_SUPPLY = ethers.parseEther("10000000"); // 10M tokens
    const MAX_SUPPLY = ethers.parseEther("50000000"); // 50M tokens
    const MAX_MINT_AMOUNT = ethers.parseEther("1000000"); // 1M tokens
    const BASIS_POINTS = 10000;
    const MAX_TAX_RATE = 1000; // 10%

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, taxWallet] = await ethers.getSigners();

        const BrewFiTokenV2 = await ethers.getContractFactory("BrewFiTokenV2");
        brewFiTokenV2 = await BrewFiTokenV2.deploy(owner.address);
        await brewFiTokenV2.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct initial values", async function () {
            expect(await brewFiTokenV2.name()).to.equal("BrewFi Token V2");
            expect(await brewFiTokenV2.symbol()).to.equal("BREWFI");
            expect(await brewFiTokenV2.decimals()).to.equal(18);
            expect(await brewFiTokenV2.totalSupply()).to.equal(INITIAL_SUPPLY);
            expect(await brewFiTokenV2.maxMintAmount()).to.equal(MAX_MINT_AMOUNT);
            expect(await brewFiTokenV2.taxRate()).to.equal(0);
            expect(await brewFiTokenV2.taxEnabled()).to.be.false;
            expect(await brewFiTokenV2.whitelistEnabled()).to.be.false;
            expect(await brewFiTokenV2.paused()).to.be.false;
        });

        it("Should set the correct roles for owner", async function () {
            expect(await brewFiTokenV2.hasRole(await brewFiTokenV2.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
            expect(await brewFiTokenV2.hasRole(await brewFiTokenV2.ADMIN_ROLE(), owner.address)).to.be.true;
            expect(await brewFiTokenV2.hasRole(await brewFiTokenV2.MINTER_ROLE(), owner.address)).to.be.true;
            expect(await brewFiTokenV2.hasRole(await brewFiTokenV2.BURNER_ROLE(), owner.address)).to.be.true;
            expect(await brewFiTokenV2.hasRole(await brewFiTokenV2.PAUSER_ROLE(), owner.address)).to.be.true;
            expect(await brewFiTokenV2.hasRole(await brewFiTokenV2.TAX_MANAGER_ROLE(), owner.address)).to.be.true;
        });
    });

    describe("Minting", function () {
        it("Should allow minter to mint tokens", async function () {
            const mintAmount = ethers.parseEther("1000");
            await brewFiTokenV2.mint(addr1.address, mintAmount, "Test mint");
            
            expect(await brewFiTokenV2.balanceOf(addr1.address)).to.equal(mintAmount);
            expect(await brewFiTokenV2.totalSupply()).to.equal(INITIAL_SUPPLY + mintAmount);
        });

        it("Should not allow non-minter to mint tokens", async function () {
            const mintAmount = ethers.parseEther("1000");
            await expect(
                brewFiTokenV2.connect(addr1).mint(addr2.address, mintAmount, "Test mint")
            ).to.be.revertedWithCustomError(brewFiTokenV2, "AccessControlUnauthorizedAccount");
        });

        it("Should not allow minting more than max mint amount", async function () {
            const mintAmount = MAX_MINT_AMOUNT + ethers.parseEther("1");
            await expect(
                brewFiTokenV2.mint(addr1.address, mintAmount, "Test mint")
            ).to.be.revertedWith("BrewFiTokenV2: amount exceeds max mint amount");
        });

        it("Should not allow minting more than max supply", async function () {
            // This test is complex due to max mint amount limits
            // Instead, let's test the logic by temporarily increasing max mint amount
            const originalMaxMint = await brewFiTokenV2.maxMintAmount();
            
            // Set max mint amount to allow testing max supply
            const maxMintable = MAX_SUPPLY - INITIAL_SUPPLY;
            await brewFiTokenV2.setMaxMintAmount(maxMintable);
            
            // Mint up to max supply
            await brewFiTokenV2.mint(addr1.address, maxMintable, "Test mint");
            
            // Now try to mint 1 more token
            await expect(
                brewFiTokenV2.mint(addr1.address, ethers.parseEther("1"), "Test mint")
            ).to.be.revertedWith("BrewFiTokenV2: would exceed max supply");
            
            // Restore original max mint amount
            await brewFiTokenV2.setMaxMintAmount(originalMaxMint);
        });
    });

    describe("Burning", function () {
        beforeEach(async function () {
            // Transfer some tokens to addr1 for burning tests
            await brewFiTokenV2.transfer(addr1.address, ethers.parseEther("1000"));
        });

        it("Should allow burner to burn tokens", async function () {
            const burnAmount = ethers.parseEther("100");
            const initialBalance = await brewFiTokenV2.balanceOf(addr1.address);
            const initialSupply = await brewFiTokenV2.totalSupply();

            // Grant burner role to addr1
            await brewFiTokenV2.grantRole(await brewFiTokenV2.BURNER_ROLE(), addr1.address);
            await brewFiTokenV2.connect(addr1).burn(burnAmount, "Test burn");

            expect(await brewFiTokenV2.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
            expect(await brewFiTokenV2.totalSupply()).to.equal(initialSupply - burnAmount);
        });

        it("Should allow burner to burn tokens from another address", async function () {
            const burnAmount = ethers.parseEther("100");
            const initialBalance = await brewFiTokenV2.balanceOf(addr1.address);
            const initialSupply = await brewFiTokenV2.totalSupply();

            // First approve the burner
            await brewFiTokenV2.connect(addr1).approve(owner.address, burnAmount);
            
            await brewFiTokenV2.burnFrom(addr1.address, burnAmount, "Test burn from");

            expect(await brewFiTokenV2.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
            expect(await brewFiTokenV2.totalSupply()).to.equal(initialSupply - burnAmount);
        });

        it("Should not allow non-burner to burn tokens", async function () {
            const burnAmount = ethers.parseEther("100");
            await expect(
                brewFiTokenV2.connect(addr2).burn(burnAmount, "Test burn")
            ).to.be.revertedWithCustomError(brewFiTokenV2, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Pause/Unpause", function () {
        it("Should allow pauser to pause the contract", async function () {
            await brewFiTokenV2.pause();
            expect(await brewFiTokenV2.paused()).to.be.true;
        });

        it("Should allow pauser to unpause the contract", async function () {
            await brewFiTokenV2.pause();
            await brewFiTokenV2.unpause();
            expect(await brewFiTokenV2.paused()).to.be.false;
        });

        it("Should not allow non-pauser to pause the contract", async function () {
            await expect(
                brewFiTokenV2.connect(addr1).pause()
            ).to.be.revertedWithCustomError(brewFiTokenV2, "AccessControlUnauthorizedAccount");
        });

        it("Should prevent transfers when paused", async function () {
            await brewFiTokenV2.pause();
            await expect(
                brewFiTokenV2.transfer(addr1.address, ethers.parseEther("100"))
            ).to.be.revertedWithCustomError(brewFiTokenV2, "EnforcedPause");
        });
    });

    describe("Tax Mechanism", function () {
        beforeEach(async function () {
            await brewFiTokenV2.setTaxWallet(taxWallet.address);
            await brewFiTokenV2.setTaxRate(500); // 5%
            await brewFiTokenV2.setTaxEnabled(true);
        });

        it("Should apply tax on transfers when enabled", async function () {
            const transferAmount = ethers.parseEther("1000");
            const taxAmount = transferAmount * BigInt(500) / BigInt(BASIS_POINTS); // 5%
            const netAmount = transferAmount - taxAmount;

            await brewFiTokenV2.transfer(addr1.address, transferAmount);

            expect(await brewFiTokenV2.balanceOf(addr1.address)).to.equal(netAmount);
            expect(await brewFiTokenV2.balanceOf(taxWallet.address)).to.equal(taxAmount);
        });

        it("Should not apply tax when disabled", async function () {
            await brewFiTokenV2.setTaxEnabled(false);
            
            const transferAmount = ethers.parseEther("1000");
            await brewFiTokenV2.transfer(addr1.address, transferAmount);

            expect(await brewFiTokenV2.balanceOf(addr1.address)).to.equal(transferAmount);
            expect(await brewFiTokenV2.balanceOf(taxWallet.address)).to.equal(0);
        });

        it("Should not allow tax rate above maximum", async function () {
            await expect(
                brewFiTokenV2.setTaxRate(MAX_TAX_RATE + 1)
            ).to.be.revertedWith("BrewFiTokenV2: tax rate exceeds maximum");
        });

        it("Should not allow non-tax-manager to set tax rate", async function () {
            await expect(
                brewFiTokenV2.connect(addr1).setTaxRate(500)
            ).to.be.revertedWithCustomError(brewFiTokenV2, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Blacklist/Whitelist", function () {
        it("Should prevent transfers from blacklisted addresses", async function () {
            await brewFiTokenV2.setBlacklist(addr1.address, true);
            
            await expect(
                brewFiTokenV2.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
            ).to.be.revertedWith("BrewFiTokenV2: account is blacklisted");
        });

        it("Should prevent transfers to blacklisted addresses", async function () {
            await brewFiTokenV2.setBlacklist(addr2.address, true);
            
            await expect(
                brewFiTokenV2.transfer(addr2.address, ethers.parseEther("100"))
            ).to.be.revertedWith("BrewFiTokenV2: account is blacklisted");
        });

        it("Should allow transfers when whitelist is enabled and address is whitelisted", async function () {
            await brewFiTokenV2.setWhitelistEnabled(true);
            await brewFiTokenV2.setWhitelist(owner.address, true); // Whitelist owner
            await brewFiTokenV2.setWhitelist(addr1.address, true); // Whitelist recipient
            
            const transferAmount = ethers.parseEther("100");
            await brewFiTokenV2.transfer(addr1.address, transferAmount);
            
            expect(await brewFiTokenV2.balanceOf(addr1.address)).to.equal(transferAmount);
        });

        it("Should prevent transfers when whitelist is enabled and address is not whitelisted", async function () {
            await brewFiTokenV2.setWhitelistEnabled(true);
            
            await expect(
                brewFiTokenV2.transfer(addr1.address, ethers.parseEther("100"))
            ).to.be.revertedWith("BrewFiTokenV2: account is not whitelisted");
        });
    });

    describe("Vesting", function () {
        it("Should create vesting schedule", async function () {
            const vestingAmount = ethers.parseEther("10000");
            const cliffDuration = 365 * 24 * 60 * 60; // 1 year
            const vestingDuration = 4 * 365 * 24 * 60 * 60; // 4 years

            await brewFiTokenV2.createVestingSchedule(
                addr1.address,
                vestingAmount,
                cliffDuration,
                vestingDuration,
                true
            );

            expect(await brewFiTokenV2.hasVestingSchedule(addr1.address)).to.be.true;
            
            const schedule = await brewFiTokenV2.getVestingSchedule(addr1.address);
            expect(schedule.totalAmount).to.equal(vestingAmount);
            expect(schedule.cliffDuration).to.equal(cliffDuration);
            expect(schedule.vestingDuration).to.equal(vestingDuration);
            expect(schedule.revocable).to.be.true;
        });

        it("Should not allow releasing tokens before cliff period", async function () {
            const vestingAmount = ethers.parseEther("10000");
            const cliffDuration = 365 * 24 * 60 * 60; // 1 year
            const vestingDuration = 4 * 365 * 24 * 60 * 60; // 4 years

            await brewFiTokenV2.createVestingSchedule(
                addr1.address,
                vestingAmount,
                cliffDuration,
                vestingDuration,
                true
            );

            expect(await brewFiTokenV2.getReleasableAmount(addr1.address)).to.equal(0);
        });

        it("Should allow revoking vesting schedule", async function () {
            const vestingAmount = ethers.parseEther("10000");
            const cliffDuration = 0; // No cliff
            const vestingDuration = 365 * 24 * 60 * 60; // 1 year

            await brewFiTokenV2.createVestingSchedule(
                addr1.address,
                vestingAmount,
                cliffDuration,
                vestingDuration,
                true
            );

            await brewFiTokenV2.revokeVestingSchedule(addr1.address);
            
            const schedule = await brewFiTokenV2.getVestingSchedule(addr1.address);
            expect(schedule.revoked).to.be.true;
        });
    });

    describe("Access Control", function () {
        it("Should support AccessControl interface", async function () {
            expect(await brewFiTokenV2.supportsInterface("0x7965db0b")).to.be.true; // AccessControl interface ID
        });

        it("Should allow admin to grant roles", async function () {
            await brewFiTokenV2.grantRole(await brewFiTokenV2.MINTER_ROLE(), addr1.address);
            expect(await brewFiTokenV2.hasRole(await brewFiTokenV2.MINTER_ROLE(), addr1.address)).to.be.true;
        });

        it("Should allow admin to revoke roles", async function () {
            await brewFiTokenV2.grantRole(await brewFiTokenV2.MINTER_ROLE(), addr1.address);
            await brewFiTokenV2.revokeRole(await brewFiTokenV2.MINTER_ROLE(), addr1.address);
            expect(await brewFiTokenV2.hasRole(await brewFiTokenV2.MINTER_ROLE(), addr1.address)).to.be.false;
        });
    });

    describe("Emergency Functions", function () {
        it("Should return correct contract info", async function () {
            const info = await brewFiTokenV2.getContractInfo();
            
            expect(info.tokenName).to.equal("BrewFi Token V2");
            expect(info.tokenSymbol).to.equal("BREWFI");
            expect(info.tokenDecimals).to.equal(18);
            expect(info.currentTotalSupply).to.equal(INITIAL_SUPPLY);
            expect(info.maxSupply).to.equal(MAX_SUPPLY);
            expect(info.currentTaxRate).to.equal(0);
            expect(info.isTaxEnabled).to.be.false;
            expect(info.isPaused).to.be.false;
        });

        it("Should allow admin to recover accidentally sent tokens", async function () {
            // Deploy a mock ERC20 token
            const MockERC20 = await ethers.getContractFactory("MockERC20");
            const mockToken = await MockERC20.deploy("Mock Token", "MOCK", 18);
            await mockToken.waitForDeployment();

            // Mint some tokens to owner
            await mockToken.mint(owner.address, ethers.parseEther("1000000"));

            // Send some tokens to the contract
            await mockToken.transfer(await brewFiTokenV2.getAddress(), ethers.parseEther("1000"));

            const recoverAmount = ethers.parseEther("500");
            await brewFiTokenV2.recoverTokens(await mockToken.getAddress(), recoverAmount);

            expect(await mockToken.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000") - ethers.parseEther("1000") + recoverAmount);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle zero amount transfers", async function () {
            // Zero amount transfers should work (ERC20 standard allows this)
            await brewFiTokenV2.transfer(addr1.address, 0);
            expect(await brewFiTokenV2.balanceOf(addr1.address)).to.equal(0);
        });

        it("Should handle zero address transfers", async function () {
            await expect(
                brewFiTokenV2.transfer(ethers.ZeroAddress, ethers.parseEther("100"))
            ).to.be.revertedWithCustomError(brewFiTokenV2, "ERC20InvalidReceiver");
        });

        it("Should handle insufficient balance transfers", async function () {
            await expect(
                brewFiTokenV2.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
            ).to.be.revertedWithCustomError(brewFiTokenV2, "ERC20InsufficientBalance");
        });
    });
});