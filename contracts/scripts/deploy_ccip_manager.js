const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const signers = await ethers.getSigners();
    console.log("Signers found:", signers.length);
    if (signers.length === 0) {
        console.error("No signers found. Check your hardhat config or .env");
        process.exit(1);
    }
    const deployer = signers[0];
    console.log("Deploying CrossChainEscrowManager with:", deployer.address);

    const deploymentPath = path.join(__dirname, "deployment_addresses.json");
    let addresses = {};
    if (fs.existsSync(deploymentPath)) {
        addresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    }

    const mockRouter = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";

    console.log("1. Deploying CrossChainEscrowManager...");
    const Manager = await ethers.getContractFactory("CrossChainEscrowManager");
    const manager = await Manager.deploy(mockRouter, deployer.address);
    await manager.waitForDeployment();
    addresses.CrossChainEscrowManager = await manager.getAddress();
    console.log("CrossChainEscrowManager deployed to:", addresses.CrossChainEscrowManager);

    fs.writeFileSync(deploymentPath, JSON.stringify(addresses, null, 2));

    const frontendConfigPath = path.resolve(__dirname, "..", "..", "frontend", "src", "constants.js");
    if (fs.existsSync(frontendConfigPath)) {
        let content = fs.readFileSync(frontendConfigPath, 'utf8');
        const updateConst = (name, val) => {
            const regex = new RegExp(`export const ${name} = IS_AMOY\\s+\\?\\s+'.*'\\s+:\\s+'.*';`);
            if (regex.test(content)) {
                content = content.replace(regex, `export const ${name} = IS_AMOY ? '${val}' : '${val}';`);
            } else {
                content += `\nexport const ${name} = IS_AMOY ? '${val}' : '${val}';`;
            }
        };
        updateConst("CROSS_CHAIN_ESCROW_MANAGER_ADDRESS", addresses.CrossChainEscrowManager);
        fs.writeFileSync(frontendConfigPath, content);
        console.log("Updated frontend constants.js.");
    }

    console.log("Deployment Complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
