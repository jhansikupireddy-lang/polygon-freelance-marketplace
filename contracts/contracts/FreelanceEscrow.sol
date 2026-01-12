// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./FreelanceRenderer.sol";

interface IArbitrator {
    function createDispute(uint256 _choices, bytes calldata _extraData) external payable returns (uint256 disputeID);
    function arbitrationCost(bytes calldata _extraData) external view returns (uint256 cost);
}

interface IArbitrable {
    event Ruling(IArbitrator indexed _arbitrator, uint256 indexed _disputeID, uint256 _ruling);
    function rule(uint256 _disputeID, uint256 _ruling) external;
}

interface IFreelanceSBT {
    function mintContribution(address to, uint16 categoryId, uint8 rating, uint256 jobId, address client) external returns (uint256);
}

/**
 * @title FreelanceEscrow
 * @notice Refactored for Antigravity's EVM.
 * Implements: 1. Milestone Factory, 2. Decentralized Dispute Resolution, 3. Soulbound Identity (SBT).
 */
contract FreelanceEscrow is Initializable, ERC721Upgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable, IArbitrable {
    using SafeERC20 for IERC20;

    enum JobStatus { Created, Ongoing, Disputed, Completed, Cancelled }

    struct Milestone {
        uint256 amount;
        string ipfsHash;
    }

    struct Job {
        address client;          
        address freelancer;      
        uint256 amount;
        uint256 totalPaidOut;
        JobStatus status;        
        uint16 categoryId;       
        uint16 milestoneCount;   
        uint8 rating;            
        bool paid;               
        address token;           
        string ipfsHash;
    }

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => mapping(uint256 => Milestone)) public jobMilestones;
    mapping(uint256 => uint256) public milestoneBitmask;
    mapping(uint256 => uint256) public disputeIdToJobId;
    
    uint256 public jobCount;
    address public arbitrator;
    address public sbtContract;
    address public entryPoint;
    address public trustedForwarder;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount);
    event FundsReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount);
    event MilestoneReleased(uint256 indexed jobId, uint256 indexed milestoneId, uint256 amount);
    event DisputeRaised(uint256 indexed jobId, uint256 disputeId);

    error NotAuthorized();
    error InvalidStatus();
    error AlreadyPaid();
    error InvalidMilestone();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin, address forwarder) public initializer {
        __ERC721_init("FreelanceWork", "FWORK");
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
        trustedForwarder = forwarder;
        arbitrator = admin;
    }

    struct CreateParams {
        uint256 categoryId;
        address freelancer;
        address token;
        uint256 amount;
        string ipfsHash;
        uint256[] mAmounts;
        string[] mHashes;
    }

    /**
     * @notice Milestone Factory: Locks funds and defines stages upfront.
     */
    function createJob(CreateParams calldata p) external payable nonReentrant {
        if (p.token != address(0)) {
            IERC20(p.token).safeTransferFrom(_msgSender(), address(this), p.amount);
        } else {
            require(msg.value >= p.amount, "Low value");
        }

        uint256 jobId = ++jobCount;
        Job storage job = jobs[jobId];
        job.client = _msgSender();
        job.freelancer = p.freelancer;
        job.token = p.token;
        job.amount = p.amount;
        job.status = JobStatus.Created;
        job.ipfsHash = p.ipfsHash;
        job.categoryId = uint16(p.categoryId);
        job.milestoneCount = uint16(p.mAmounts.length);

        for (uint256 i = 0; i < p.mAmounts.length; i++) {
            jobMilestones[jobId][i] = Milestone(p.mAmounts[i], p.mHashes[i]);
        }

        emit JobCreated(jobId, job.client, p.freelancer, p.amount);
    }

    /**
     * @notice Stage-based release of funds.
     */
    function releaseMilestone(uint256 jobId, uint256 mId) external nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        
        uint256 mask = 1 << mId;
        if ((milestoneBitmask[jobId] & mask) != 0) revert InvalidMilestone();
        milestoneBitmask[jobId] |= mask;

        uint256 amt = jobMilestones[jobId][mId].amount;
        job.totalPaidOut += amt;
        
        _sendFunds(job.freelancer, job.token, amt);
        emit MilestoneReleased(jobId, mId, amt);
    }

    /**
     * @notice Completion and SBT Minting.
     */
    function completeJob(uint256 jobId, uint8 rating) external nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        if (job.paid) revert AlreadyPaid();

        job.paid = true;
        job.status = JobStatus.Completed;
        job.rating = rating;

        uint256 payout = job.amount - job.totalPaidOut;
        if (payout > 0) _sendFunds(job.freelancer, job.token, payout);

        _safeMint(job.freelancer, jobId);
        if (sbtContract != address(0)) {
            IFreelanceSBT(sbtContract).mintContribution(job.freelancer, job.categoryId, rating, jobId, job.client);
        }
        emit FundsReleased(jobId, job.freelancer, payout);
    }

    /**
     * @notice Decentralized Dispute Integration.
     */
    function raiseDispute(uint256 jobId) external payable nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client && _msgSender() != job.freelancer) revert NotAuthorized();
        job.status = JobStatus.Disputed;

        if (arbitrator != address(0)) {
            uint256 cost = IArbitrator(arbitrator).arbitrationCost("");
            uint256 dId = IArbitrator(arbitrator).createDispute{value: cost}(2, "");
            disputeIdToJobId[dId] = jobId;
        }
    }

    function rule(uint256 dId, uint256 ruling) external override {
        if (_msgSender() != arbitrator) revert NotAuthorized();
        uint256 jobId = disputeIdToJobId[dId];
        Job storage job = jobs[jobId];

        if (ruling == 1) { // Client
            job.status = JobStatus.Cancelled;
            _sendFunds(job.client, job.token, job.amount - job.totalPaidOut);
        } else { // Freelancer
            job.status = JobStatus.Completed;
            _sendFunds(job.freelancer, job.token, job.amount - job.totalPaidOut);
            _safeMint(job.freelancer, jobId);
        }
        emit Ruling(IArbitrator(arbitrator), dId, ruling);
    }

    function _sendFunds(address to, address token, uint256 amt) internal {
        if (token == address(0)) {
            (bool s, ) = payable(to).call{value: amt}("");
            require(s, "failed");
        } else {
            IERC20(token).safeTransfer(to, amt);
        }
    }

    function tokenURI(uint256 jobId) public view override returns (string memory) {
        Job storage job = jobs[jobId];
        return FreelanceRenderer.constructTokenURI(FreelanceRenderer.RenderParams({
            jobId: jobId,
            categoryId: job.categoryId,
            amount: job.amount,
            rating: job.rating,
            ipfsHash: job.ipfsHash
        }));
    }

    function supportsInterface(bytes4 id) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(id);
    }

    function _msgSender() internal view virtual override returns (address sender) {
        if (msg.sender == trustedForwarder || msg.sender == entryPoint) return tx.origin;
        return super._msgSender();
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
