const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const governanceAddress = "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1";
    const sbtAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";

    const governance = await ethers.getContractAt("FreelanceGovernance", governanceAddress);
    const sbt = await ethers.getContractAt("FreelanceSBT", sbtAddress);

    console.log("Preparing Quadratic Voting demonstration...");

    // 1. Ensure user has enough reputation to propose
    const balance = await sbt.balanceOf(deployer.address);
    if (balance < 5n) {
        console.log("Boosting reputation for demonstration...");
        const MINTER_ROLE = await sbt.MINTER_ROLE();
        await sbt.grantRole(MINTER_ROLE, deployer.address);
        for (let i = 0; i < 5; i++) {
            await sbt.safeMint(deployer.address, "ipfs://reputation-boost");
        }
        console.log("Reputation boosted to 5 Karma.");
    }

    // 2. Create a Quadratic Voting Proposal
    console.log("Creating Proposal: 'Implementation of Layer2 Gas Rebates for High-Reputation Freelancers'");
    try {
        const tx = await governance.createProposal(
            "Proposal to implement a gas rebate system using the DAO treasury for freelancers with 10+ Karma.",
            true // Enable Quadratic Voting
        );
        await tx.wait();
        console.log("✅ Proposal #1 Created with Quadratic Voting enabled!");
    } catch (e) {
        if (e.message.includes("Insufficient reputation")) {
            console.error("FATAL: Reputation boost failed in script.");
        } else {
            console.error("Proposal creation error:", e.message);
        }
        return;
    }

    // 3. Status Report
    const propCount = await governance.proposalCount();
    const prop = await governance.proposals(propCount);

    console.log("\n--- Proposal Details ---");
    console.log("ID:", prop.id.toString());
    console.log("Description:", prop.description);
    console.log("Quadratic Voting:", prop.quadratic ? "ENABLED" : "DISABLED");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
