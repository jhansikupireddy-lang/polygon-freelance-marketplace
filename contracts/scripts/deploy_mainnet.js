const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const POLYGON_LZ_ENDPOINT = "0x1a4471e1227038fd69a3043dccf5a6a6d63495f5"; // Example Mainnet LZ Endpoint
    const KLEROS_MAINNET = "0x988b3A538b618C74d7B28271a95D889F122a6320"; // Kleros Court on Polygon

    // 1. Deploy PolyToken
    console.log("Deploying PolyToken...");
    const PolyToken = await ethers.getContractFactory("PolyToken");
    const polyToken = await PolyToken.deploy(deployer.address);
    await polyToken.waitForDeployment();
    const polyTokenAddress = await polyToken.getAddress();
    console.log("PolyToken deployed to:", polyTokenAddress);

    // 2. Deploy FreelanceEscrow as Proxy
    console.log("Deploying FreelanceEscrow Proxy...");
    const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
    const escrow = await upgrades.deployProxy(FreelanceEscrow, [
        deployer.address,        // initialOwner
        deployer.address,        // trustedForwarder (placeholder)
        ethers.ZeroAddress,      // ccipRouter (if not using CCIP immediately)
        ethers.ZeroAddress       // insurancePool (if not deployed)
    ], {
        constructorArgs: [POLYGON_LZ_ENDPOINT],
        kind: 'uups'
    });
    await escrow.waitForDeployment();
    const escrowAddress = await escrow.getAddress();
    console.log("FreelanceEscrow Proxy deployed to:", escrowAddress);

    // 3. Post-Deployment Configuration
    console.log("Configuring contracts...");

    // Set PolyToken in Escrow
    await escrow.setPolyToken(polyTokenAddress);
    console.log("PolyToken address set in Escrow.");

    // Set Escrow as Minter in PolyToken
    await polyToken.setMinter(escrowAddress, true);
    console.log("Escrow set as Minter in PolyToken.");

    // Set Kleros Arbitrator
    // Note: This would typically be a transaction to the storage of 'arbitrator'
    // For now, it's the owner by default in initialize, but we can update if needed
    // await escrow.setArbitrator(KLEROS_MAINNET); 

    console.log("\n--- Production Deployment Summary ---");
    console.log("Network: Polygon Mainnet");
    console.log("PolyToken:", polyTokenAddress);
    console.log("FreelanceEscrow (Proxy):", escrowAddress);
    console.log("------------------------------------\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
