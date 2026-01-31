const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("💨 Starting Zenith Smoke Test...");

    const addressesPath = path.join(__dirname, "deployment_addresses.json");
    if (!fs.existsSync(addressesPath)) {
        console.error("❌ Error: deployment_addresses.json not found. Deploy first!");
        process.exit(1);
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    const [deployer] = await ethers.getSigners();
    console.log(`Testing with account: ${deployer.address}`);

    // 1. Check PolyToken
    const poly = await ethers.getContractAt("PolyToken", addresses.PolyToken);
    const polyName = await poly.name();
    const polyBal = await poly.balanceOf(deployer.address);
    console.log(`✅ PolyToken: ${polyName} | Balance: ${ethers.formatEther(polyBal)}`);

    // 2. Check FreelanceEscrow
    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);
    const jobCount = await escrow.jobCount();
    console.log(`✅ FreelanceEscrow: Job Count = ${jobCount}`);

    // 3. Create a dummy job
    console.log("Approving token spend...");
    await (await poly.approve(addresses.FreelanceEscrow, ethers.parseEther("100"))).wait();

    console.log("Creating dummy job...");
    const tx = await escrow.createJob({
        categoryId: 1,
        freelancer: ethers.ZeroAddress,
        token: addresses.PolyToken,
        amount: ethers.parseEther("100"),
        ipfsHash: "ipfs://test-metadata",
        deadline: Math.floor(Date.now() / 1000) + (3600 * 24 * 7),
        mAmounts: [ethers.parseEther("50"), ethers.parseEther("50")],
        mHashes: ["ipfs://m1", "ipfs://m2"]
    });
    await tx.wait();
    const currentJobCount = await escrow.jobCount();
    console.log(`✅ Job Created! New Job Count: ${currentJobCount}`);

    // 4. Check Governance
    const gov = await ethers.getContractAt("FreelanceGovernance", addresses.FreelanceGovernance);
    const proposalCount = await gov.proposalCount();
    console.log(`✅ FreelanceGovernance: Proposal Count = ${proposalCount}`);

    // 5. Create a dummy proposal
    console.log("Creating dummy proposal...");
    const sbt = await ethers.getContractAt("FreelanceSBT", addresses.FreelanceSBT);
    const MINTER_ROLE = await sbt.MINTER_ROLE();
    await (await sbt.grantRole(MINTER_ROLE, deployer.address)).wait();

    // Need at least 5 reputation to propose
    for (let i = 0; i < 5; i++) {
        await (await sbt.safeMint(deployer.address, `ipfs://smoke-rep-${i}`)).wait();
    }

    const propTx = await gov.createProposal(
        "Smoke Test Proposal",
        false, false, false, false, false, 0,
        ethers.ZeroAddress,
        "0x"
    );
    await propTx.wait();
    const currentPropCount = await gov.proposalCount();
    console.log(`✅ Proposal Created! New Proposal Count: ${currentPropCount}`);

    console.log("\n🔥 SMOKE TEST PASSED: Core Protocol is Healthy.");
}

main().catch((error) => {
    console.error("❌ SMOKE TEST FAILED:", error);
    process.exitCode = 1;
});
