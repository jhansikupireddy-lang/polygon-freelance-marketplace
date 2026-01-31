const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer, client, freelancer] = await ethers.getSigners();
    const deploymentPath = path.join(__dirname, "deployment_addresses.json");
    const addresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);

    console.log("Creating demo job on:", addresses.FreelanceEscrow);

    const params = {
        categoryId: 1,
        freelancer: ethers.ZeroAddress,
        token: ethers.ZeroAddress,
        amount: ethers.parseEther("0.5"),
        ipfsHash: "ipfs://demo-job-metadata",
        deadline: 0,
        mAmounts: [],
        mHashes: []
    };

    const tx = await escrow.connect(client).createJob(params, { value: ethers.parseEther("0.5") });
    const receipt = await tx.wait();

    console.log("Job created! Hash:", tx.hash);
}

main().catch(console.error);
