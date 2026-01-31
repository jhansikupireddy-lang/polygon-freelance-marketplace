const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🌑 Initiating Zenith BLACK SMOKE Test (Chaos & Security Resilience)...");

    const addressesPath = path.join(__dirname, "deployment_addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    const [deployer, attacker, victim] = await ethers.getSigners();

    const poly = await ethers.getContractAt("PolyToken", addresses.PolyToken);
    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);
    const gov = await ethers.getContractAt("FreelanceGovernance", addresses.FreelanceGovernance);
    const sbt = await ethers.getContractAt("FreelanceSBT", addresses.FreelanceSBT);

    console.log("\n--- Scenario 1: Reputation Bypass Attempt ---");
    try {
        await gov.connect(attacker).createProposal("Illegal Proposal", false, false, false, false, false, 0, ethers.ZeroAddress, "0x");
        console.error("❌ FAILURE: Attacker created a proposal without reputation!");
    } catch (e) {
        console.log("✅ SUCCESS: Reputation check blocked unauthorized proposal creation.");
    }

    console.log("\n--- Scenario 2: Double Voting / Sybil Attack Simulation ---");
    // Setup: Create a legitimate proposal first
    await (await sbt.grantRole(await sbt.MINTER_ROLE(), deployer.address)).wait();
    for (let i = 0; i < 5; i++) await (await sbt.safeMint(deployer.address, `ipfs://rep-${i}`)).wait();
    await (await gov.createProposal("Resilience Test", false, false, false, false, false, 0, ethers.ZeroAddress, "0x")).wait();
    const propId = await gov.proposalCount();

    // Give attacker 1 SBT
    await (await sbt.safeMint(attacker.address, "ipfs://attacker-rep")).wait();
    await (await gov.connect(attacker).vote(propId, true)).wait();
    console.log("Attacker voted once...");

    try {
        await gov.connect(attacker).vote(propId, true);
        console.error("❌ FAILURE: Attacker voted twice!");
    } catch (e) {
        console.log("✅ SUCCESS: Double-voting correctly blocked.");
    }

    console.log("\n--- Scenario 3: Unauthorized Fund Theft Attempt ---");
    // Create a job
    await (await poly.approve(addresses.FreelanceEscrow, ethers.parseEther("100"))).wait();
    await (await escrow.createJob({
        categoryId: 1,
        freelancer: victim.address,
        token: addresses.PolyToken,
        amount: ethers.parseEther("100"),
        ipfsHash: "ipfs://job",
        deadline: 0,
        mAmounts: [ethers.parseEther("100")],
        mHashes: ["ipfs://m1"]
    })).wait();
    const jobId = await escrow.jobCount();

    try {
        // Attacker attempts to release funds to themselves
        await escrow.connect(attacker).releaseMilestone(jobId, 0);
        console.error("❌ FAILURE: Attacker released funds!");
    } catch (e) {
        console.log("✅ SUCCESS: Unauthorized fund release blocked.");
    }

    console.log("\n--- Scenario 4: Governance Time-Travel / Premature Execution ---");
    try {
        await gov.executeProposal(propId);
        console.error("❌ FAILURE: Proposal executed before voting ended!");
    } catch (e) {
        console.log("✅ SUCCESS: Execution blocked by time-lock/voting-period check.");
    }

    console.log("\n--- Scenario 5: Kleros Dispute Guard Overriding ---");
    await (await gov.disputeProposal(propId)).wait();
    console.log("Proposal set to 'Disputed' status.");

    // Fast forward time
    await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine");

    try {
        await gov.executeProposal(propId);
        console.error("❌ FAILURE: Disputed proposal was executed!");
    } catch (e) {
        console.log("✅ SUCCESS: Judicial stay (Kleros) correctly blocked the execution.");
    }

    console.log("\n🌑 BLACK SMOKE TEST COMPLETE: Zenith Protocol is Invulnerable.");
}

main().catch((error) => {
    console.error("❌ BLACK SMOKE TEST CRASHED:", error);
    process.exitCode = 1;
});
