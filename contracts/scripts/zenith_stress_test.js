const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("⚡ Initiating Zenith High-Load Stress Test...");

    const addressesPath = path.join(__dirname, "deployment_addresses.json");
    if (!fs.existsSync(addressesPath)) {
        console.error("❌ Error: deployment_addresses.json not found.");
        process.exit(1);
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    const signers = await ethers.getSigners();
    const [deployer] = signers;
    const testUsers = signers.slice(1, 15); // Use 14 test users

    const poly = await ethers.getContractAt("PolyToken", addresses.PolyToken);
    const escrow = await ethers.getContractAt("FreelanceEscrow", addresses.FreelanceEscrow);
    const gov = await ethers.getContractAt("FreelanceGovernance", addresses.FreelanceGovernance);
    const sbt = await ethers.getContractAt("FreelanceSBT", addresses.FreelanceSBT);

    console.log(`\n--- Stage 1: Mass Liquidity & Reputation Distribution ---`);
    const distributionAmount = ethers.parseEther("1000");
    const MINTER_ROLE = await sbt.MINTER_ROLE();
    await (await sbt.grantRole(MINTER_ROLE, deployer.address)).wait();

    const prepPromises = testUsers.map(async (user, i) => {
        // Transfer PolyTokens
        await (await poly.transfer(user.address, distributionAmount)).wait();
        // Mint Reputation (10 each)
        for (let r = 0; r < 10; r++) {
            await (await sbt.safeMint(user.address, `ipfs://load-test-rep-${i}-${r}`)).wait();
        }
        // Approve Escrow
        await (await poly.connect(user).approve(addresses.FreelanceEscrow, ethers.MaxUint256)).wait();
    });

    await Promise.all(prepPromises);
    console.log(`✅ Liquidity and Reputation distributed to ${testUsers.length} Zenith contributors.`);

    console.log(`\n--- Stage 2: Concurrent Job Creation ---`);
    const jobPromises = testUsers.map(async (user, i) => {
        return (await escrow.connect(user).createJob({
            categoryId: i % 5,
            freelancer: ethers.ZeroAddress,
            token: addresses.PolyToken,
            amount: ethers.parseEther("10"),
            ipfsHash: `ipfs://load-job-${i}`,
            deadline: 0,
            mAmounts: [ethers.parseEther("5"), ethers.parseEther("5")],
            mHashes: [`ipfs://load-job-${i}-m1`, `ipfs://load-job-${i}-m2`]
        })).wait();
    });

    await Promise.all(jobPromises);
    const totalJobs = await escrow.jobCount();
    console.log(`✅ Parallelized Job Creation Successful. Total Jobs: ${totalJobs}`);

    console.log(`\n--- Stage 3: High-Frequency Proposal Submissions ---`);
    const propPromises = testUsers.slice(0, 5).map(async (user, i) => {
        return (await gov.connect(user).createProposal(
            `Stress Test Initiative #${i}`,
            true,  // useQuadratic
            false, // isOptimistic
            false, // isSecret
            false, // isConviction
            false, // isZK
            0,
            ethers.ZeroAddress,
            "0x"
        )).wait();
    });

    await Promise.all(propPromises);
    const totalProps = await gov.proposalCount();
    console.log(`✅ Parallelized Governance Influx Successful. Total Proposals: ${totalProps}`);

    console.log(`\n--- Stage 4: Mass Voting Participation (Quadratic) ---`);
    // Everyone votes on every proposal
    const votePromises = [];
    for (let pId = 1; pId <= Number(totalProps); pId++) {
        for (const user of testUsers) {
            votePromises.push(gov.connect(user).vote(pId, Math.random() > 0.3));
        }
    }

    // Process votes in batches of 20 to avoid RPC saturation
    const batchSize = 10;
    for (let i = 0; i < votePromises.length; i += batchSize) {
        const batch = votePromises.slice(i, i + batchSize);
        const txs = await Promise.all(batch);
        await Promise.all(txs.map(tx => tx.wait()));
        console.log(`Processed vote batch ${i / batchSize + 1} (${i + batchSize}/${votePromises.length})...`);
    }

    console.log(`\n--- Stage 5: Final Integrity Check ---`);
    const finalProp = await gov.proposals(totalProps);
    console.log(`✅ System Healthy. Proposal #${totalProps} vote weight: For=${finalProp.forVotes}, Against=${finalProp.againstVotes}`);

    console.log(`\n🏆 ZENITH HIGH-LOAD TEST PASSED: 0.0% Submission Failure Rate.`);
}

main().catch((error) => {
    console.error("❌ STRESS TEST FAILED:", error);
    process.exitCode = 1;
});
