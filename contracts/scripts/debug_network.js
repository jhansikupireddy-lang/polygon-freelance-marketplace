const hre = require("hardhat");
async function main() {
    console.log("Network name:", hre.network.name);
    console.log("Configured accounts:", hre.network.config.accounts);
}
main().catch(console.error);
