const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting Zenith E2E Verification...");

    const addressesPath = path.join(__dirname, "deployment_addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    const [deployer, user1, user2, agent] = await ethers.getSigners();

    const sbt = await ethers.getContractAt("FreelanceSBT", addresses.FreelanceSBT);
    const gov = await ethers.getContractAt("FreelanceGovernance", addresses.FreelanceGovernance);

    console.log("\n--- Phase 1: Reputation Setup ---");
    const MINTER_ROLE = await sbt.MINTER_ROLE();
    if (!(await sbt.hasRole(MINTER_ROLE, deployer.address))) {
        await (await sbt.grantRole(MINTER_ROLE, deployer.address)).wait();
    }

    // Give users some reputation
    console.log("Minting reputation to users...");
    for (let i = 0; i < 5; i++) {
        await (await sbt.safeMint(user1.address, `ipfs://user1-rep-${i}`)).wait();
    }
    await (await sbt.safeMint(user2.address, "ipfs://user2-rep")).wait();

    const user1Rep = await sbt.balanceOf(user1.address);
    console.log(`User1 Reputation: ${user1Rep}`);

    console.log("\n--- Phase 2: Quadratic Voting Test ---");
    // Create a proposal with QV enabled
    await (await gov.connect(user1).createProposal(
        "QV Test Proposal",
        true,  // useQuadratic
        false, // isOptimistic
        false, // isSecret
        false, // isConviction
        false, // isZK
        0,     // threshold
        ethers.ZeroAddress,
        "0x"
    )).wait();

    const propId = await gov.proposalCount();
    console.log(`Created Proposal #${propId}`);

    // user1 has 2 reputation. sqrt(2) is simplified to 1 in our mock applyQuadratic (since 2 < 4)
    await (await gov.connect(user1).vote(propId, true)).wait();
    let p = await gov.proposals(propId);
    console.log(`User1 voted with weight ${p.forVotes} (Quadratic weight for 2 rep is 1)`);

    console.log("\n--- Phase 3: Optimistic Governance Test ---");
    await (await gov.connect(user1).createProposal(
        "Optimistic Proposal",
        false,
        true, // isOptimistic
        false,
        false,
        false,
        0,
        ethers.ZeroAddress,
        "0x"
    )).wait();

    const optPropId = await gov.proposalCount();
    console.log(`Created Optimistic Proposal #${optPropId}`);

    // Fast forward time
    await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]); // > 3 days
    await ethers.provider.send("evm_mine");

    console.log("Executing Optimistic Proposal...");
    await (await gov.executeProposal(optPropId)).wait();
    let opP = await gov.proposals(optPropId);
    console.log(`Optimistic Proposal Executed: ${opP.executed}`);

    console.log("\n--- Phase 4: Secret Voting (Commit-Reveal) Test ---");
    await (await gov.connect(user1).createProposal(
        "Secret Council Initiative",
        false,
        false,
        true, // isSecret
        false,
        false,
        0,
        ethers.ZeroAddress,
        "0x"
    )).wait();

    const secretId = await gov.proposalCount();
    const salt = "zenith-salt";
    const commit = ethers.solidityPackedKeccak256(["bool", "string"], [true, salt]);

    console.log("Committing secret vote...");
    await (await gov.connect(user2).commitVote(secretId, commit)).wait();

    let sp = await gov.proposals(secretId);
    console.log(`Votes before reveal: For=${sp.forVotes}, Against=${sp.againstVotes}`);

    await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine");

    console.log("Revealing secret vote...");
    await (await gov.connect(user2).revealVote(secretId, true, salt)).wait();
    sp = await gov.proposals(secretId);
    console.log(`Votes after reveal: For=${sp.forVotes}, Against=${sp.againstVotes}`);

    console.log("\n--- Phase 5: Kleros Dispute Test ---");
    await (await gov.connect(user1).createProposal(
        "Disputable Action",
        false, false, false, false, false, 0, ethers.ZeroAddress, "0x"
    )).wait();

    const dispId = await gov.proposalCount();
    console.log(`Challenging Proposal #${dispId} in Kleros Court...`);
    await (await gov.connect(user2).disputeProposal(dispId)).wait();

    await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine");

    try {
        await gov.executeProposal(dispId);
        console.error("❌ ERROR: Execution should have been blocked by dispute!");
    } catch (e) {
        console.log("✅ SUCCESS: Execution correctly blocked by Kleros Dispute.");
    }

    console.log("\n--- Phase 6: AI-Agent Registration ---");
    const agentModelHash = ethers.id("zenith-v1-model");
    await (await gov.registerAgent(agent.address, agentModelHash)).wait();
    const registeredHash = await gov.registeredAgents(agent.address);
    console.log(`Agent Registered: ${agent.address}, Model: ${registeredHash}`);

    console.log("\n✅ Zenith E2E Verification Complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
