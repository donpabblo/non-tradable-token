const { expect } = require("chai");

var contractAddress = "";

describe("Setup", function () {
    it("Deployment", async function () {
        const contract = await ethers.getContractFactory("NTT");
        hardhatContract = await contract.deploy("Non-tradable token", "NTT");
        contractAddress = hardhatContract.address;
        expect(await hardhatContract.name()).to.equal("Non-tradable token");
        expect(await hardhatContract.symbol()).to.equal("NTT");
    });
});

describe("Minting", function () {
    it("Minting OK", async function () {
        const [owner, user] = await ethers.getSigners();

        const contract = await hre.ethers.getContractAt("NTT", contractAddress);
        const txResponse = await contract.mint(user.address);
        await txResponse.wait();

        const balance = await contract.balanceOf(user.address);
        expect(BigInt(balance)).to.equal(BigInt(1));

        const ownerOf = await contract.ownerOf(0);
        expect(ownerOf).to.equal(user.address);

        const isValid = await contract.isValid(0);
        expect(isValid).to.be.true;

        const hasValid = await contract.hasValid(user.address);
        expect(hasValid).to.be.true;

        const emittedCount = await contract.emittedCount();
        expect(BigInt(emittedCount)).to.equal(BigInt(1));

        const holdersCount = await contract.holdersCount();
        expect(BigInt(holdersCount)).to.equal(BigInt(1));

        const tokenURI = await contract.tokenURI(0);
        expect(tokenURI).to.equal("http://localhost/0x0000000000000000000000000000000000000000000000000000000000000000");

        const tokenOfOwnerByIndex = await contract.tokenOfOwnerByIndex(user.address, 0);
        expect(BigInt(tokenOfOwnerByIndex)).to.equal(BigInt(0));

    });

    it("User tries to Mint", async function () {
        const [owner, user] = await ethers.getSigners();
        const contract = await hre.ethers.getContractAt("NTT", contractAddress);
        const txResponse = await contract.connect(user).mint(user.address).catch(err => {
            expect(err.message).to.contain("Only Contract creator can mint");
        });
    });
    
});

describe("Revoking", function () {
    it("User tries to revoke", async function () {
        const [owner, user] = await ethers.getSigners();
        const contract = await hre.ethers.getContractAt("NTT", contractAddress);
        const txResponse = await contract.connect(user).revoke(0).catch(err => {
            expect(err.message).to.contain("Only Contract creator can revoke");
        });
    });

    it("Revoking OK", async function () {
        const [owner, user] = await ethers.getSigners();

        const contract = await hre.ethers.getContractAt("NTT", contractAddress);
        const txResponse = await contract.revoke(0);
        await txResponse.wait();

        const isValid = await contract.isValid(0);
        expect(isValid).to.be.false;

        const balance = await contract.balanceOf(user.address);
        expect(BigInt(balance)).to.equal(BigInt(1));

        const ownerOf = await contract.ownerOf(0);
        expect(ownerOf).to.equal(user.address);

        const hasValid = await contract.hasValid(user.address);
        expect(hasValid).to.be.false;

        const emittedCount = await contract.emittedCount();
        expect(BigInt(emittedCount)).to.equal(BigInt(1));

        const holdersCount = await contract.holdersCount();
        expect(BigInt(holdersCount)).to.equal(BigInt(1));

        const tokenURI = await contract.tokenURI(0);
        expect(tokenURI).to.equal("http://localhost/0x0000000000000000000000000000000000000000000000000000000000000000");

        const tokenOfOwnerByIndex = await contract.tokenOfOwnerByIndex(user.address, 0);
        expect(BigInt(tokenOfOwnerByIndex)).to.equal(BigInt(0));

    });
});