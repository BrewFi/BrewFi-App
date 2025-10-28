const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BrewFiToken", function () {
  let brewFiToken;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let totalSupply;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy contract
    const BrewFiToken = await ethers.getContractFactory("BrewFiToken");
    brewFiToken = await BrewFiToken.deploy(owner.address);
    await brewFiToken.waitForDeployment();

    // Calculate total supply (10,000,000 tokens with 18 decimals)
    totalSupply = ethers.parseUnits("10000000", 18);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await brewFiToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await brewFiToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(totalSupply);
    });

    it("Should return correct token name and symbol", async function () {
      expect(await brewFiToken.name()).to.equal("BrewFi Token");
      expect(await brewFiToken.symbol()).to.equal("BREWFI");
    });

    it("Should return correct decimals", async function () {
      expect(await brewFiToken.decimals()).to.equal(18);
    });

    it("Should return correct total supply in human-readable format", async function () {
      expect(await brewFiToken.getTotalSupply()).to.equal(10000000);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.parseUnits("1000", 18);
      
      await brewFiToken.transfer(addr1.address, amount);
      const addr1Balance = await brewFiToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(amount);
    });

    it("Should emit Transfer event on transfer", async function () {
      const amount = ethers.parseUnits("500", 18);
      
      await expect(brewFiToken.transfer(addr1.address, amount))
        .to.emit(brewFiToken, "Transfer")
        .withArgs(owner.address, addr1.address, amount);
    });
  });

  describe("Airdrop functionality", function () {
    it("Should allow owner to airdrop to single recipient", async function () {
      const amount = ethers.parseUnits("1000", 18);
      
      await expect(brewFiToken.airdrop(addr1.address, amount))
        .to.emit(brewFiToken, "AirdropExecuted")
        .withArgs(addr1.address, amount);
      
      const addr1Balance = await brewFiToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(amount);
    });

    it("Should prevent non-owner from airdropping", async function () {
      const amount = ethers.parseUnits("1000", 18);
      
      await expect(
        brewFiToken.connect(addr1).airdrop(addr2.address, amount)
      ).to.be.revertedWithCustomError(brewFiToken, "OwnableUnauthorizedAccount");
    });

    it("Should prevent airdrop to zero address", async function () {
      const amount = ethers.parseUnits("1000", 18);
      
      await expect(
        brewFiToken.airdrop(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("BrewFiToken: recipient cannot be zero address");
    });

    it("Should prevent airdrop of zero amount", async function () {
      await expect(
        brewFiToken.airdrop(addr1.address, 0)
      ).to.be.revertedWith("BrewFiToken: amount must be greater than zero");
    });

    it("Should prevent airdrop with insufficient balance", async function () {
      const excessiveAmount = ethers.parseUnits("20000000", 18);
      
      await expect(
        brewFiToken.airdrop(addr1.address, excessiveAmount)
      ).to.be.revertedWith("BrewFiToken: insufficient balance for airdrop");
    });
  });

  describe("Batch Airdrop functionality", function () {
    it("Should allow owner to batch airdrop to multiple recipients", async function () {
      const recipients = [addr1.address, addr2.address, addr3.address];
      const amounts = [
        ethers.parseUnits("1000", 18),
        ethers.parseUnits("2000", 18),
        ethers.parseUnits("3000", 18)
      ];
      
      const totalAmount = ethers.parseUnits("6000", 18);
      
      await expect(brewFiToken.batchAirdrop(recipients, amounts))
        .to.emit(brewFiToken, "BatchAirdropExecuted")
        .withArgs(recipients.length, totalAmount);
      
      expect(await brewFiToken.balanceOf(addr1.address)).to.equal(amounts[0]);
      expect(await brewFiToken.balanceOf(addr2.address)).to.equal(amounts[1]);
      expect(await brewFiToken.balanceOf(addr3.address)).to.equal(amounts[2]);
    });

    it("Should emit AirdropExecuted event for each recipient", async function () {
      const recipients = [addr1.address, addr2.address];
      const amounts = [
        ethers.parseUnits("1000", 18),
        ethers.parseUnits("2000", 18)
      ];
      
      const tx = await brewFiToken.batchAirdrop(recipients, amounts);
      const receipt = await tx.wait();
      
      // Check events
      const events = receipt.logs
        .map(log => {
          try {
            return brewFiToken.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .filter(e => e !== null && e.name === "AirdropExecuted");
      
      expect(events.length).to.equal(2);
    });

    it("Should prevent batch airdrop with mismatched arrays", async function () {
      const recipients = [addr1.address, addr2.address];
      const amounts = [ethers.parseUnits("1000", 18)];
      
      await expect(
        brewFiToken.batchAirdrop(recipients, amounts)
      ).to.be.revertedWith("BrewFiToken: arrays length mismatch");
    });

    it("Should prevent batch airdrop with empty array", async function () {
      await expect(
        brewFiToken.batchAirdrop([], [])
      ).to.be.revertedWith("BrewFiToken: recipients array is empty");
    });

    it("Should prevent non-owner from batch airdropping", async function () {
      const recipients = [addr2.address];
      const amounts = [ethers.parseUnits("1000", 18)];
      
      await expect(
        brewFiToken.connect(addr1).batchAirdrop(recipients, amounts)
      ).to.be.revertedWithCustomError(brewFiToken, "OwnableUnauthorizedAccount");
    });

    it("Should prevent batch airdrop with insufficient balance", async function () {
      const recipients = [addr1.address];
      const excessiveAmount = ethers.parseUnits("20000000", 18);
      const amounts = [excessiveAmount];
      
      await expect(
        brewFiToken.batchAirdrop(recipients, amounts)
      ).to.be.revertedWith("BrewFiToken: insufficient balance for batch airdrop");
    });
  });
});

