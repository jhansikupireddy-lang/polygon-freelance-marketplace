// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FreelanceEscrow is ERC721URIStorage, Ownable, ReentrancyGuard {
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
        address token; // address(0) for native MATIC
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

    function createJob(address freelancer, address token, uint256 amount, string memory _initialMetadataUri) external payable nonReentrant {
        if (token == address(0)) {
            require(msg.value == amount && amount > 0, "Invalid native amount");
        } else {
            require(msg.value == 0, "Do not send native with token job");
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }
        require(freelancer != address(0), "Invalid freelancer");
        require(freelancer != msg.sender, "No self-hiring");

        jobCount++;
        jobs[jobCount] = Job({
            id: jobCount,
            client: msg.sender,
            freelancer: freelancer,
            token: token,
            amount: amount,
            freelancerStake: 0,
            totalPaidOut: 0,
            status: JobStatus.Created,
            resultUri: _initialMetadataUri,
            paid: false,
            milestoneCount: 0
        });

        emit JobCreated(jobCount, msg.sender, freelancer, amount);
    }

    function createJobWithMilestones(
        address freelancer,
        address token,
        uint256 totalAmount,
        string memory _initialMetadataUri,
        uint256[] memory milestoneAmounts,
        string[] memory milestoneDescriptions
    ) external payable nonReentrant {
        require(milestoneAmounts.length == milestoneDescriptions.length, "Mismatched milestones");
        
        uint256 calcTotal = 0;
        for(uint256 i = 0; i < milestoneAmounts.length; i++) {
            calcTotal += milestoneAmounts[i];
        }
        require(calcTotal == totalAmount && totalAmount > 0, "Invalid total amount");

        if (token == address(0)) {
            require(msg.value == totalAmount, "Invalid native amount");
        } else {
            require(msg.value == 0, "No native with token");
            IERC20(token).transferFrom(msg.sender, address(this), totalAmount);
        }

        jobCount++;
        jobs[jobCount] = Job({
            id: jobCount,
            client: msg.sender,
            freelancer: freelancer,
            token: token,
            amount: totalAmount,
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

        emit JobCreated(jobCount, msg.sender, freelancer, totalAmount);
    }

    function releaseMilestone(uint256 jobId, uint256 milestoneId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client, "Only client can release milestones");
        require(milestoneId < job.milestoneCount, "Invalid milestone ID");
        
        Milestone storage milestone = jobMilestones[jobId][milestoneId];
        require(!milestone.isReleased, "Already released");
        require(!job.paid, "Job already finalized");

        milestone.isReleased = true;
        job.totalPaidOut += milestone.amount;

        if (job.token == address(0)) {
            (bool success, ) = payable(job.freelancer).call{value: milestone.amount}("");
            require(success, "Native transfer failed");
        } else {
            IERC20(job.token).transfer(job.freelancer, milestone.amount);
        }

        emit MilestoneReleased(jobId, milestoneId, milestone.amount);
    }

    function acceptJob(uint256 jobId) external payable nonReentrant {
        Job storage job = jobs[jobId];
        require(msg.sender == job.freelancer, "Only freelancer can accept");
        require(job.status == JobStatus.Created, "Invalid status");
        
        uint256 requiredStake = (job.amount * FREELANCER_STAKE_PERCENT) / 100;
        
        if (job.token == address(0)) {
            require(msg.value >= requiredStake, "Insufficient stake");
            job.freelancerStake = msg.value;
        } else {
            require(msg.value == 0, "No native stake for token job");
            IERC20(job.token).transferFrom(msg.sender, address(this), requiredStake);
            job.freelancerStake = requiredStake;
        }

        job.status = JobStatus.Accepted;
        emit JobAccepted(jobId, msg.sender, job.freelancerStake);
    }

    function submitWork(uint256 jobId, string memory resultUri) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.freelancer, "Only freelancer can submit work");
        require(job.status == JobStatus.Accepted || job.status == JobStatus.Ongoing, "Invalid job status");

        job.status = JobStatus.Ongoing;
        job.resultUri = resultUri;

        emit WorkSubmitted(jobId, resultUri);
    }

    function releaseFunds(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client, "Only client can release funds");
        require(job.status == JobStatus.Ongoing, "Work must be submitted first");
        require(!job.paid, "Funds already released");

        job.paid = true;
        job.status = JobStatus.Completed;

        uint256 remainingAmount = job.amount - job.totalPaidOut;
        uint256 totalPayout = remainingAmount + job.freelancerStake;
        
        if (totalPayout > 0) {
            if (job.token == address(0)) {
                (bool success, ) = payable(job.freelancer).call{value: totalPayout}("");
                require(success, "Native transfer failed");
            } else {
                IERC20(job.token).transfer(job.freelancer, totalPayout);
            }
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

    function resolveDispute(uint256 jobId, address winner, uint256 freelancerAmount) external nonReentrant {
        require(msg.sender == arbitrator, "Only arbitrator can resolve");
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Disputed, "Job not in dispute");
        require(winner == job.client || winner == job.freelancer, "Invalid winner");
        
        uint256 totalPool = job.amount + job.freelancerStake - job.totalPaidOut;
        require(freelancerAmount <= totalPool, "Amount exceeds pool");

        job.paid = true;
        job.status = JobStatus.Completed;

        uint256 clientRefund = totalPool - freelancerAmount;

        if (job.token == address(0)) {
            if (freelancerAmount > 0) {
                (bool success, ) = payable(job.freelancer).call{value: freelancerAmount}("");
                require(success, "Freelancer payout failed");
            }
            if (clientRefund > 0) {
                (bool refundSuccess, ) = payable(job.client).call{value: clientRefund}("");
                require(refundSuccess, "Client refund failed");
            }
        } else {
            if (freelancerAmount > 0) {
                IERC20(job.token).transfer(job.freelancer, freelancerAmount);
            }
            if (clientRefund > 0) {
                IERC20(job.token).transfer(job.client, clientRefund);
            }
        }
    }
}
