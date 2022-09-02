const { task } = require("hardhat/config");
const { writeConfig } = require("./helpers");

task("deploy", "Deploys contract")
    .setAction(async function (taskArguments, hre) {
        const contract = await hre.ethers.getContractFactory("NTT");
        const NTT = await contract.deploy("Don Pablo NTT", "NTT");
        const address = NTT.address;
        console.log(`NTT contract deployed to address: ${address}`);

        writeConfig(address);

    });