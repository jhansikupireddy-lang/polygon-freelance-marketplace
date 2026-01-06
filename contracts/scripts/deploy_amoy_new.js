const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const lzEndpoint = process.env.LZ_ENDPOINT || "0x0000000000000000000000000000000000000000";
    const ccipRouter = process.env.CCIP_ROUTER || "0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb88464";
    const insurancePool = process.env.INSURANCE_POOL || "0x0000000000000000000000000000000000000000";
    const trustedForwarder = "0x0000000000000000000000000000000000000000";

    // 1. Deploy PolyToken
    console.log("Deploying PolyToken...");
    const PolyToken = await ethers.getContractFactory("PolyToken");
    const polyToken = await PolyToken.deploy(deployer.address);
    await polyToken.waitForDeployment();
    console.log("PolyToken deployed to:", await polyToken.getAddress());

    // 2. Deploy FreelanceEscrow (UUPS Proxy)
    console.log("Deploying FreelanceEscrow proxy...");
    const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
    const escrow = await upgrades.deployProxy(
        FreelanceEscrow,
        [deployer.address, trustedForwarder, ccipRouter, insurancePool],
        {
            initializer: "initialize",
            kind: "uups",
            constructorArgs: [lzEndpoint]
        }
    );
    await escrow.waitForDeployment();
    const escrowAddress = await escrow.getAddress();
    console.log("FreelanceEscrow proxy deployed to:", escrowAddress);

    // 3. Post-deployment setup
    console.log("Setting PolyToken in Escrow...");
    await escrow.setPolyToken(await polyToken.getAddress());

    console.log("Granting Minter role to Escrow...");
    const MINTER_ROLE = await polyToken.MINTER_ROLE();
    await polyToken.grantRole(MINTER_ROLE, escrowAddress);

    console.log("\nDeployment Success!");
    console.log("PolyToken:", await polyToken.getAddress());
    console.log("FreelanceEscrow:", escrowAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
