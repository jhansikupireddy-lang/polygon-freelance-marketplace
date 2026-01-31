const hre = require("hardhat");

async function main() {
    console.log("\n🚀 Starting Cross-Chain Voting Simulation (LayerZero V2 Logic)...\n");

    const [alice, bob] = await hre.ethers.getSigners();
    console.log(`Voter (Alice): ${alice.address}`);
    console.log(`Relayer (Bob): ${bob.address}\n`);

    // 1. Deploy Governor on "Chain A" (Source)
    const CrossChainGovernor = await hre.ethers.getContractFactory("CrossChainGovernor");

    // Chain A EID: 101, Chain B EID: 102
    const hubGovernor = await CrossChainGovernor.deploy(alice.address, alice.address); // Mocking endpoint as alice
    await hubGovernor.waitForDeployment();
    console.log(`[Chain A - Hub] Deployed at: ${hubGovernor.target}`);

    // 2. Deploy Governor on "Chain B" (Spoke)
    const spokeGovernor = await CrossChainGovernor.deploy(alice.address, alice.address);
    await spokeGovernor.waitForDeployment();
    console.log(`[Chain B - Spoke] Deployed at: ${spokeGovernor.target}\n`);

    // 3. Setup Virtual Peers
    const hubPeer = hre.ethers.zeroPadValue(hubGovernor.target, 32);
    const spokePeer = hre.ethers.zeroPadValue(spokeGovernor.target, 32);

    await hubGovernor.setPeer(102, spokePeer);
    await spokeGovernor.setPeer(101, hubPeer);
    console.log("✅ Virtual peering established between Hub (Chain A) and Spoke (Chain B).");

    // 4. Simulate a Vote Casting on Source Chain (Spoke)
    const proposalId = 42;
    const support = true;
    const weight = 1000; // e.g. 1000 SBT/Karma points

    console.log(`\n🗳️ alice is voting FOR Proposal #${proposalId} from Spoke Chain...`);

    // In reality, this would be an lzSend call. 
    // We'll prepare the payload that the "Endpoint" would deliver.
    const payload = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bool", "uint256"],
        [alice.address, proposalId, support, weight]
    );

    console.log("📡 Relaying message via simulated LayerZero Protocol...");

    // 5. Deliver the message to Hub Chain (lzReceive)
    const guid = hre.ethers.randomBytes(32);
    const tx = await hubGovernor.simulateLzReceive(
        101, // srcEid
        guid,
        payload
    );
    await tx.wait();

    console.log("✨ Message delivered and processed on Chain A (Hub)!");

    // 6. Verify Results on Hub Chain
    const forVotes = await hubGovernor.proposalVotes(proposalId, true);
    const againstVotes = await hubGovernor.proposalVotes(proposalId, false);
    const hasAliceVoted = await hubGovernor.hasVoted(proposalId, alice.address);

    console.log("\n📊 Final Governance State on Hub Chain:");
    console.log(`- Proposal #${proposalId} FOR: ${forVotes.toString()}`);
    console.log(`- Proposal #${proposalId} AGAINST: ${againstVotes.toString()}`);
    console.log(`- Alice Voted: ${hasAliceVoted ? "YES" : "NO"}`);

    if (forVotes.toString() === "1000") {
        console.log("\n🏆 SIMULATION SUCCESSFUL: Cross-chain vote correctly recorded.");
    } else {
        console.log("\n❌ SIMULATION FAILED: Vote mismatch.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
