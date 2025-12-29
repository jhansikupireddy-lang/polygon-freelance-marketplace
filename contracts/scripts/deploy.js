const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting deployment of FreelanceEscrow...");

    const FreelanceEscrow = await hre.ethers.getContractFactory("FreelanceEscrow");
    const contract = await FreelanceEscrow.deploy();

    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("FreelanceEscrow deployed to:", address);

    // Update the frontend contract address automatically
    const frontendConfigPath = path.resolve(__dirname, "..", "..", "frontend", "src", "constants.js");
    const configContent = `export const CONTRACT_ADDRESS = "${address}";\n`;
    fs.writeFileSync(frontendConfigPath, configContent);
    console.log("Updated frontend constants.js with new address.");

    console.log("\nNext Steps:");
    console.log("1. Wait for a few minutes for the contract to be indexed by the block explorer.");
    console.log(`2. Verify the contract using: npx hardhat verify --network polygon_amoy ${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
