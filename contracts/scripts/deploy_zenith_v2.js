const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying Zenith V2 Enhancements with:", deployer.address);

    const deploymentPath = path.join(__dirname, "deployment_addresses.json");
    let addresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    // 1. Deploy PrivacyShield
    console.log("\n1. Deploying PrivacyShield...");
    const PrivacyShield = await ethers.getContractFactory("PrivacyShield");
    const privacyShield = await PrivacyShield.deploy(deployer.address);
    await privacyShield.waitForDeployment();
    addresses.PrivacyShield = await privacyShield.getAddress();
    console.log("PrivacyShield deployed to:", addresses.PrivacyShield);

    // 2. Deploy PolyCompletionSBT
    console.log("\n2. Deploying PolyCompletionSBT...");
    const PolyCompletionSBT = await ethers.getContractFactory("PolyCompletionSBT");
    const completionSBT = await PolyCompletionSBT.deploy(deployer.address, addresses.FreelanceEscrow);
    await completionSBT.waitForDeployment();
    addresses.PolyCompletionSBT = await completionSBT.getAddress();
    console.log("PolyCompletionSBT deployed to:", addresses.PolyCompletionSBT);

    // 3. Update FreelanceEscrow
    console.log("\n3. Updating FreelanceEscrow with new Zenith services...");
    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);

    // Link Privacy Shield
    const tx1 = await escrow.setPrivacyShield(addresses.PrivacyShield);
    await tx1.wait();
    console.log("Linked PrivacyShield to Escrow.");

    // Link Completion Certificates
    const tx2 = await escrow.setCompletionCertContract(addresses.PolyCompletionSBT);
    await tx2.wait();
    console.log("Linked CompletionCertSBT to Escrow.");

    // Link FreelanceSBT (Ensure it's the one from addresses if not already)
    const tx3 = await escrow.setSBTContract(addresses.FreelanceSBT);
    await tx3.wait();
    console.log("Linked FreelanceSBT to Escrow.");

    // 4. Grant Roles
    console.log("\n4. Granting roles...");
    // Give Escrow MODERATOR_ROLE or similar if PrivacyShield requires it? 
    // PrivacyShield currently only has verifyReputationProof for onlyOwner.

    // PolyCompletionSBT requires msg.sender == marketplace for mintContribution
    // This was already set in constructor but let's double check if we need to update it
    const certMarketplace = await completionSBT.marketplace();
    console.log("Certificate Marketplace set to:", certMarketplace);

    // Save progress
    fs.writeFileSync(deploymentPath, JSON.stringify(addresses, null, 2));
    console.log("\nZenith V2 Deployment Complete.");

    // Update frontend constants
    const frontendConfigPath = path.resolve(__dirname, "..", "..", "frontend", "src", "constants.js");
    if (fs.existsSync(frontendConfigPath)) {
        let content = fs.readFileSync(frontendConfigPath, 'utf8');

        const updateConst = (name, val) => {
            const regex = new RegExp(`export const ${name} = IS_AMOY\\s+\\?\\s+'.*'\\s+:\\s+'.*';`);
            if (regex.test(content)) {
                content = content.replace(regex, `export const ${name} = IS_AMOY ? '${val}' : '${val}';`);
            } else {
                // If the pattern is simpler
                const simpleRegex = new RegExp(`export const ${name} = '.*';`);
                if (simpleRegex.test(content)) {
                    content = content.replace(simpleRegex, `export const ${name} = '${val}';`);
                } else {
                    // Append if not found
                    content += `\nexport const ${name} = IS_AMOY ? '${val}' : '${val}';`;
                }
            }
        };

        updateConst("PRIVACY_SHIELD_ADDRESS", addresses.PrivacyShield);
        updateConst("COMPLETION_SBT_ADDRESS", addresses.PolyCompletionSBT);
        updateConst("FREELANCE_SBT_ADDRESS", addresses.FreelanceSBT);

        fs.writeFileSync(frontendConfigPath, content);
        console.log("Updated frontend constants.js.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
