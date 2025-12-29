// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FreelanceEscrow is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    address public arbitrator;
    uint256 public constant FREELANCER_STAKE_PERCENT = 10; // 10% stake required

    enum JobStatus { Created, Accepted, Ongoing, Disputed, Completed, Cancelled }

    struct Milestone {
        uint256 amount;
        string description;
        bool isReleased;
    }

    struct Review {
        uint8 rating; // 1-5
        string comment;
        address reviewer;
    }

    struct Job {
        uint256 id;
        address client;
        address freelancer;
        uint256 amount;
        uint256 freelancerStake;
        uint256 totalPaidOut;
        JobStatus status;
        string resultUri;
        bool paid;
        uint256 milestoneCount;
    }

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => mapping(uint256 => Milestone)) public jobMilestones;
    mapping(uint256 => Review) public reviews;
    uint256 public jobCount;

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount);
    event JobAccepted(uint256 indexed jobId, address indexed freelancer, uint256 stake);
    event WorkSubmitted(uint256 indexed jobId, string resultUri);
    event FundsReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount, uint256 nftId);
    event MilestoneCreated(uint256 indexed jobId, uint256 milestoneId, uint256 amount, string description);
    event MilestoneReleased(uint256 indexed jobId, uint256 milestoneId, uint256 amount);
    event ReviewSubmitted(uint256 indexed jobId, address indexed reviewer, uint8 rating, string comment);
    event JobCancelled(uint256 indexed jobId);
    event JobDisputed(uint256 indexed jobId);

    constructor() ERC721("FreelanceWork", "FWORK") Ownable(msg.sender) {
        arbitrator = msg.sender; // Default to owner
    }

    function setArbitrator(address _arbitrator) external onlyOwner {
        require(_arbitrator != address(0), "Invalid address");
        arbitrator = _arbitrator;
    }

    function createJob(address freelancer, string memory _initialMetadataUri) external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(freelancer != address(0), "Invalid freelancer address");
        require(freelancer != msg.sender, "Client cannot be freelancer");

        jobCount++;
        jobs[jobCount] = Job({
            id: jobCount,
            client: msg.sender,
            freelancer: freelancer,
            amount: msg.value,
            freelancerStake: 0,
            totalPaidOut: 0,
            status: JobStatus.Created,
            resultUri: _initialMetadataUri,
            paid: false,
            milestoneCount: 0
        });

        emit JobCreated(jobCount, msg.sender, freelancer, msg.value);
    }

    function createJobWithMilestones(
        address freelancer, 
        string memory _initialMetadataUri, 
        uint256[] memory milestoneAmounts, 
        string[] memory milestoneDescriptions
    ) external payable {
        require(milestoneAmounts.length == milestoneDescriptions.length, "Mismatched milestones");
        require(msg.value > 0, "Amount must be greater than 0");
        
        uint256 totalMilestoneAmount = 0;
        for(uint256 i = 0; i < milestoneAmounts.length; i++) {
            totalMilestoneAmount += milestoneAmounts[i];
        }
        require(totalMilestoneAmount == msg.value, "Total milestones must equal value");

        jobCount++;
        jobs[jobCount] = Job({
            id: jobCount,
            client: msg.sender,
            freelancer: freelancer,
            amount: msg.value,
            freelancerStake: 0,
            totalPaidOut: 0,
            status: JobStatus.Created,
            resultUri: _initialMetadataUri,
            paid: false,
            milestoneCount: milestoneAmounts.length
        });

        for(uint256 i = 0; i < milestoneAmounts.length; i++) {
            jobMilestones[jobCount][i] = Milestone({
                amount: milestoneAmounts[i],
                description: milestoneDescriptions[i],
                isReleased: false
            });
            emit MilestoneCreated(jobCount, i, milestoneAmounts[i], milestoneDescriptions[i]);
        }

        emit JobCreated(jobCount, msg.sender, freelancer, msg.value);
    }

    function releaseMilestone(uint256 jobId, uint256 milestoneId) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client, "Only client can release milestones");
        require(milestoneId < job.milestoneCount, "Invalid milestone ID");
        
        Milestone storage milestone = jobMilestones[jobId][milestoneId];
        require(!milestone.isReleased, "Already released");
        require(!job.paid, "Job already finalized");

        milestone.isReleased = true;
        job.totalPaidOut += milestone.amount;

        (bool success, ) = payable(job.freelancer).call{value: milestone.amount}("");
        require(success, "Transfer failed");

        emit MilestoneReleased(jobId, milestoneId, milestone.amount);
    }

    function acceptJob(uint256 jobId) external payable {
        Job storage job = jobs[jobId];
        require(msg.sender == job.freelancer, "Only freelancer can accept");
        require(job.status == JobStatus.Created, "Invalid status");
        
        uint256 requiredStake = (job.amount * FREELANCER_STAKE_PERCENT) / 100;
        require(msg.value >= requiredStake, "Insufficient stake");

        job.freelancerStake = msg.value;
        job.status = JobStatus.Accepted;

        emit JobAccepted(jobId, msg.sender, msg.value);
    }

    function submitWork(uint256 jobId, string memory resultUri) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.freelancer, "Only freelancer can submit work");
        require(job.status == JobStatus.Accepted || job.status == JobStatus.Ongoing, "Invalid job status");

        job.status = JobStatus.Ongoing;
        job.resultUri = resultUri;

        emit WorkSubmitted(jobId, resultUri);
    }

    function releaseFunds(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client, "Only client can release funds");
        require(job.status == JobStatus.Ongoing, "Work must be submitted first");
        require(!job.paid, "Funds already released");

        job.paid = true;
        job.status = JobStatus.Completed;

        uint256 remainingAmount = job.amount - job.totalPaidOut;
        uint256 totalPayout = remainingAmount + job.freelancerStake;
        
        if (totalPayout > 0) {
            (bool success, ) = payable(job.freelancer).call{value: totalPayout}("");
            require(success, "Transfer failed");
        }

        // Mint NFT for freelancer
        uint256 tokenId = _nextTokenId++;
        _safeMint(job.freelancer, tokenId);
        _setTokenURI(tokenId, job.resultUri);

        emit FundsReleased(jobId, job.freelancer, totalPayout, tokenId);
    }

    function submitReview(uint256 jobId, uint8 rating, string memory comment) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client, "Only client can review");
        require(job.status == JobStatus.Completed, "Job not completed");
        require(rating >= 1 && rating <= 5, "Rating 1-5");
        require(reviews[jobId].reviewer == address(0), "Review already submitted");

        reviews[jobId] = Review({
            rating: rating,
            comment: comment,
            reviewer: msg.sender
        });

        emit ReviewSubmitted(jobId, msg.sender, rating, comment);
    }

    function dispute(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client || msg.sender == job.freelancer, "Not involved in job");
        require(job.status == JobStatus.Ongoing || job.status == JobStatus.Created, "Cannot dispute now");

        job.status = JobStatus.Disputed;
        emit JobDisputed(jobId);
    }

    function resolveDispute(uint256 jobId, address winner, uint256 freelancerAmount) external {
        require(msg.sender == arbitrator, "Only arbitrator can resolve");
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Disputed, "Job not in dispute");
        require(winner == job.client || winner == job.freelancer, "Invalid winner");
        
        uint256 totalPool = job.amount + job.freelancerStake;
        require(freelancerAmount <= totalPool, "Amount exceeds pool");

        job.paid = true;
        job.status = JobStatus.Completed;

        if (freelancerAmount > 0) {
            (bool success, ) = payable(job.freelancer).call{value: freelancerAmount}("");
            require(success, "Freelancer payout failed");
        }

        uint256 clientRefund = totalPool - freelancerAmount;
        if (clientRefund > 0) {
            (bool refundSuccess, ) = payable(job.client).call{value: clientRefund}("");
            require(refundSuccess, "Client refund failed");
        }
    }
}
