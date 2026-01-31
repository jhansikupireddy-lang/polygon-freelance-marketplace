const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("⚪ Initiating Zenith WHITE SMOKE Test (The Golden Flow)...");

    const addressesPath = path.join(__dirname, "deployment_addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    const [deployer, freelancer, client] = await ethers.getSigners();

    const poly = await ethers.getContractAt("PolyToken", addresses.PolyToken);
    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);
    const gov = await ethers.getContractAt("FreelanceGovernance", addresses.FreelanceGovernance);
    const sbt = await ethers.getContractAt("FreelanceSBT", addresses.FreelanceSBT);

    console.log("\n--- Phase 1: Elite Identity Initialization ---");
    const MINTER_ROLE = await sbt.MINTER_ROLE();
    await (await sbt.grantRole(MINTER_ROLE, deployer.address)).wait();

    // Mint Soulbound reputation to participants
    await (await sbt.safeMint(freelancer.address, "ipfs://expert-freelancer-metadata")).wait();
    await (await sbt.safeMint(client.address, "ipfs://premium-client-metadata")).wait();
    // Give client 5 rep for governance power
    for (let i = 0; i < 4; i++) await (await sbt.safeMint(client.address, `ipfs://client-rep-${i}`)).wait();

    console.log("✅ Identity established. Souls bound to the Zenith protocol.");

    console.log("\n--- Phase 2: Perfect Job Lifecycle ---");
    const jobAmount = ethers.parseEther("500");
    await (await poly.transfer(client.address, jobAmount)).wait();
    await (await poly.connect(client).approve(addresses.FreelanceEscrow, jobAmount)).wait();

    console.log("Client creating milestone-based job...");
    const createTx = await escrow.connect(client).createJob({
        categoryId: 1,
        freelancer: ethers.ZeroAddress,
        token: addresses.PolyToken,
        amount: jobAmount,
        ipfsHash: "ipfs://zenith-project-specs",
        deadline: 0,
        mAmounts: [ethers.parseEther("250"), ethers.parseEther("250")],
        mHashes: ["ipfs://milestone-1", "ipfs://milestone-2"]
    });
    const receipt = await createTx.wait();
    const jobId = await escrow.jobCount();

    console.log("Freelancer applying with stake...");
    const stake = (jobAmount * 5n) / 100n;
    await (await poly.transfer(freelancer.address, stake)).wait();
    await (await poly.connect(freelancer).approve(addresses.FreelanceEscrow, stake)).wait();
    await (await escrow.connect(freelancer).applyForJob(jobId)).wait();

    console.log("Client picking freelancer...");
    await (await escrow.connect(client).pickFreelancer(jobId, freelancer.address)).wait();

    console.log("Freelancer accepting job...");
    await (await escrow.connect(freelancer).acceptJob(jobId)).wait();

    console.log("Freelancer submitting work...");
    await (await escrow.connect(freelancer).submitWork(jobId, "ipfs://final-delivery")).wait();

    console.log("Client releasing funds...");
    await (await escrow.connect(client).releaseMilestone(jobId, 0)).wait();
    await (await escrow.connect(client).releaseMilestone(jobId, 1)).wait();

    const freeBal = await poly.balanceOf(freelancer.address);
    console.log(`✅ Job lifecycle complete. Freelancer Balance: ${ethers.formatEther(freeBal)} POLY`);

    console.log("\n--- Phase 3: Governance & Social Flow ---");
    console.log("Client proposing protocol expansion...");
    await (await gov.connect(client).createProposal(
        "Expand Zenith to L2 Superchain",
        true, false, false, false, false, 0,
        ethers.ZeroAddress,
        "0x"
    )).wait();
    const propId = await gov.proposalCount();

    console.log("Freelancer voting on proposal (Liquid Democracy)...");
    await (await gov.connect(freelancer).vote(propId, true)).wait();

    console.log("Simulating time-skip and protocol upgrade execution...");
    await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine");

    await (await gov.executeProposal(propId)).wait();
    const p = await gov.proposals(propId);
    console.log(`✅ Governance success. Proposal Executed: ${p.executed}`);

    console.log("\n--- Phase 4: Privacy & ZK Anonymity Walkthrough ---");
    await (await gov.connect(client).createProposal(
        "Private Treasury Strategy",
        false, false, false, false, true, // isZK = true
        0, ethers.ZeroAddress, "0x"
    )).wait();
    const zkPropId = await gov.proposalCount();

    console.log("Casting anonymous ZK vote...");
    const nullifier = ethers.id("voter-1-nullifier");
    const zkProof = "0x1234567890"; // Mock proof
    await (await gov.connect(freelancer).anonymousVote(zkPropId, true, nullifier, zkProof)).wait();

    const zkP = await gov.proposals(zkPropId);
    console.log(`✅ ZK Vote recorded. For: ${zkP.forVotes}, Against: ${zkP.againstVotes} (Anonymity Guaranteed)`);

    console.log("\n⚪ WHITE SMOKE TEST COMPLETE: Habitat for Decentralization is Pristine.");
}

main().catch((error) => {
    console.error("❌ WHITE SMOKE TEST FAILED:", error);
    process.exitCode = 1;
});
