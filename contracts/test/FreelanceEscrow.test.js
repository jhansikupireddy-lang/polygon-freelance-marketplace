const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FreelanceEscrow", function () {
    let FreelanceEscrow;
    let escrow;
    let owner, client, freelancer, other;

    beforeEach(async function () {
        [owner, client, freelancer, other] = await ethers.getSigners();
        FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
        escrow = await FreelanceEscrow.deploy();
    });

    describe("Job Lifecycle with Staking", function () {
        it("Should create a job and allow freelancer to accept with stake", async function () {
            const amount = ethers.parseEther("1");
            await escrow.connect(client).createJob(freelancer.address, "ipfs://test", { value: amount });

            const stake = ethers.parseEther("0.1");
            await expect(escrow.connect(freelancer).acceptJob(1, { value: stake }))
                .to.emit(escrow, "JobAccepted")
                .withArgs(1, freelancer.address, stake);
        });
    });

    describe("Milestone Payments", function () {
        it("Should support jobs with multiple milestones", async function () {
            const totalAmount = ethers.parseEther("1.5");
            const milestoneAmounts = [ethers.parseEther("0.5"), ethers.parseEther("1.0")];
            const milestoneDescs = ["Milestone 1", "Milestone 2"];

            await escrow.connect(client).createJobWithMilestones(
                freelancer.address,
                "ipfs://test",
                milestoneAmounts,
                milestoneDescs,
                { value: totalAmount }
            );

            const job = await escrow.jobs(1);
            expect(job.milestoneCount).to.equal(2);

            // Release first milestone
            await escrow.connect(client).releaseMilestone(1, 0);
            const updatedJob = await escrow.jobs(1);
            expect(updatedJob.totalPaidOut).to.equal(milestoneAmounts[0]);
        });
    });

    describe("Reviews", function () {
        it("Should allow client to submit a review after completion", async function () {
            const amount = ethers.parseEther("1");
            await escrow.connect(client).createJob(freelancer.address, "ipfs://test", { value: amount });
            await escrow.connect(freelancer).acceptJob(1, { value: ethers.parseEther("0.1") });
            await escrow.connect(freelancer).submitWork(1, "ipfs://result");
            await escrow.connect(client).releaseFunds(1);

            await expect(escrow.connect(client).submitReview(1, 5, "Great work!"))
                .to.emit(escrow, "ReviewSubmitted")
                .withArgs(1, client.address, 5, "Great work!");

            const review = await escrow.reviews(1);
            expect(review.rating).to.equal(5);
        });
    });
});
