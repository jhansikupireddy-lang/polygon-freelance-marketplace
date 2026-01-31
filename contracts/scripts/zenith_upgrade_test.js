const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("🌌 Initiating Zenith Quantum-State Persistence Test (In-Memory)...");

    const [deployer, freelancer, client] = await ethers.getSigners();

    // 1. Deploy V1
    console.log("\n--- Phase 1: Deploying Zenith V1 ---");
    const Poly = await ethers.getContractFactory("PolyToken");
    const poly = await Poly.deploy(deployer.address);
    await poly.waitForDeployment();
    const polyAddr = await poly.getAddress();

    const SBT = await ethers.getContractFactory("FreelanceSBT");
    const sbt = await SBT.deploy(deployer.address, deployer.address);
    await sbt.waitForDeployment();
    const sbtAddr = await sbt.getAddress();

    const dummyForwarder = ethers.Wallet.createRandom().address;
    const EscrowV1 = await ethers.getContractFactory("FreelanceEscrow");
    const escrowProxy = await upgrades.deployProxy(EscrowV1, [
        deployer.address,
        dummyForwarder, // Use a non-admin as forwarder
        sbtAddr,
        deployer.address  // entrypoint
    ], { kind: 'uups' });
    await escrowProxy.waitForDeployment();
    const proxyAddr = await escrowProxy.getAddress();
    console.log(`Zenith V1 Proxy: ${proxyAddr}`);

    // 2. Establish V1 State
    console.log("\n--- Phase 2: Establishing V1 State ---");
    const jobAmount = ethers.parseEther("100");
    await (await poly.transfer(client.address, jobAmount)).wait();
    await (await poly.connect(client).approve(proxyAddr, jobAmount)).wait();

    console.log("Creating Job in V1...");
    const tx = await escrowProxy.connect(client).createJob({
        categoryId: 1,
        freelancer: freelancer.address,
        token: polyAddr,
        amount: jobAmount,
        ipfsHash: "ipfs://job-v1",
        deadline: 0,
        mAmounts: [jobAmount],
        mHashes: ["ipfs://m1"]
    });
    await tx.wait();

    const countV1 = await escrowProxy.jobCount();
    console.log(`✅ V1 Job Count: ${countV1}`);

    // 3. Perform Zenith Upgrade
    console.log("\n--- Phase 3: Performing Zenith V2 Upgrade ---");
    const EscrowV2 = await ethers.getContractFactory("FreelanceEscrowV2");

    console.log("Upgrading proxy...");
    const upgraded = await upgrades.upgradeProxy(proxyAddr, EscrowV2);
    await upgraded.waitForDeployment();
    console.log("✅ Upgrade Successful!");

    // 4. Verify Persistence
    console.log("\n--- Phase 4: Verifying State Persistence ---");
    const escrowV2 = await ethers.getContractAt("FreelanceEscrowV2", proxyAddr);

    const version = await escrowV2.getVersion();
    console.log(`Contract Version: ${version}`);

    const countV2 = await escrowV2.jobCount();
    console.log(`Current Job Count: ${countV2}`);

    if (countV1 === countV2) {
        console.log("✅ SUCCESS: Historical job data preserved.");
    } else {
        throw new Error("❌ FAILURE: Data mismatch after upgrade!");
    }

    // 5. Test V2 Functionality
    console.log("\n--- Phase 5: Testing V2 Features (Loyalty) ---");
    console.log("Accepting Job...");
    await (await escrowV2.connect(freelancer).acceptJob(countV2)).wait();

    console.log("Releasing via V2 logic (with Loyalty points)...");
    await (await escrowV2.connect(client).releaseMilestoneV2(countV2, 0)).wait();

    const points = await escrowV2.loyaltyPoints(freelancer.address);
    console.log(`✅ Freelancer Loyalty Points: ${points}`);

    const freeBal = await poly.balanceOf(freelancer.address);
    console.log(`Freelancer Balance: ${ethers.formatEther(freeBal)} POLY`);

    console.log("\n🏆 ZENITH UPGRADE TEST PASSED: State is preserved, Logic evolved.");
}

main().catch((error) => {
    console.error("❌ UPGRADE TEST FAILED:", error);
    process.exitCode = 1;
});
