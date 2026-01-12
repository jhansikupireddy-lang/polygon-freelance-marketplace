const hre = require("hardhat");
const { ethers } = hre;
async function main() {
    console.log("Ethers version:", ethers.version);
    const accounts = await hre.network.provider.request({ method: "eth_accounts" });
    console.log("Accounts:", accounts);
    if (accounts.length > 0) {
        const signer = await ethers.getSigner(accounts[0]);
        console.log("Signer address:", signer.address);
    }
}
main().catch(console.error);
