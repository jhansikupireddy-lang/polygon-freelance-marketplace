const { ethers } = require("hardhat");
async function main() {
    const signers = await ethers.getSigners();
    console.log("Signers found:", signers.length);
    if (signers.length > 0) {
        console.log("First signer:", signers[0].address);
    }
}
main().catch(console.error);
