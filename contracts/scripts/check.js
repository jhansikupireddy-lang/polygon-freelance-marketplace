const hre = require("hardhat");

async function main() {
    console.log("HRE Ethers type:", typeof hre.ethers);
    if (hre.ethers) {
        console.log("Ethers version:", hre.ethers.version);
        console.log("HRE Ethers keys:", Object.keys(hre.ethers).slice(0, 20));
        try {
            const signers = await hre.ethers.getSigners();
            console.log("Signers found:", signers.length);
        } catch (e) {
            const fs = require('fs');
            fs.writeFileSync('error_check.log', e.stack || e.toString());
            console.error("Error getting signers:", e.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
