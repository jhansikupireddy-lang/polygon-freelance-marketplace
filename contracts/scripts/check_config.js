const hre = require("hardhat");

async function main() {
    console.log("Current Hardhat Config Networks:");
    console.log(JSON.stringify(hre.config.networks, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
