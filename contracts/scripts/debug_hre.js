const hre = require("hardhat");
async function main() {
    console.log("HRE Ethers loaded:", !!hre.ethers);
    if (hre.ethers) {
        try {
            const signers = await hre.ethers.getSigners();
            console.log("Signers count:", signers.length);
        } catch (e) {
            console.error("Error getting signers:", e.message);
        }
    }
}
main().catch(console.error);
