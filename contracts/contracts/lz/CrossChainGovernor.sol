// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OApp.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

/**
 * @title CrossChainGovernor
 * @notice A simulation of omnichain governance with remote execution and gasless meta-txs.
 */
contract CrossChainGovernor is OApp, ERC2771Context {
    
    address private _trustedForwarder;
    
    mapping(uint256 => mapping(bool => uint256)) public proposalVotes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // Remote Execution Registry
    mapping(bytes32 => bool) public executedMessages;

    event VoteReceived(uint32 srcEid, address voter, uint256 proposalId, bool support, uint256 weight);
    event VoteSent(uint32 dstEid, uint256 proposalId, bool support);
    event RemoteActionExecuted(uint32 srcEid, bytes32 guid, address target, bytes data);

    constructor(address _owner, address _endpoint, address _forwarder) 
        OApp(_owner) 
        ERC2771Context(_forwarder) 
    {
        lzEndpoint = _endpoint;
        _trustedForwarder = _forwarder;
    }

    /**
     * @notice Simulates sending a vote to another chain.
     * @param _dstEid The destination endpoint ID.
     * @param _proposalId The ID of the proposal.
     * @param _support True if voting for, False if against.
     */
    function castVoteCrossChain(
        uint32 _dstEid,
        uint256 _proposalId,
        bool _support
    ) external payable {
        // In a real LayerZero implementation, this would call _lzSend.
        // For simulation, we just emit an event and the script will call lzReceive.
        emit VoteSent(_dstEid, _proposalId, _support);
    }

    /**
     * @notice Handles incoming messages from the LayerZero endpoint.
     * @dev Process logic: Decode the payload and record the vote.
     * @param _srcEid The source endpoint ID.
     * @param _guid The unique identifier for the cross-chain message.
     * @param _message The encoded payload (voter address, proposalId, support, weight).
     * @param _executor The address that executed the LayerZero message.
     * @param _extraData Additional data from the endpoint.
     */
    function _lzReceive(
        uint32 _srcEid,
        bytes32 _guid,
        bytes memory _message,
        address _executor,
        bytes memory _extraData
    ) internal virtual override {
        // Decode common header (actionType)
        uint8 actionType = abi.decode(_message, (uint8));

        if (actionType == 1) { // VOTE_ACTION
            (, address voter, uint256 proposalId, bool support, uint256 weight) = abi.decode(_message, (uint8, address, uint256, bool, uint256));
            
            require(!hasVoted[proposalId][voter], "Already voted");
            
            proposalVotes[proposalId][support] += weight;
            hasVoted[proposalId][voter] = true;

            emit VoteReceived(_srcEid, voter, proposalId, support, weight);
        } else if (actionType == 2) { // EXECUTE_ACTION
            (, address target, bytes memory data) = abi.decode(_message, (uint8, address, bytes));
            
            // Security: Only allow peers to trigger execution
            require(!executedMessages[_guid], "Already executed");
            
            (bool success, ) = target.call(data);
            require(success, "Remote execution failed");
            
            executedMessages[_guid] = true;
            emit RemoteActionExecuted(_srcEid, _guid, target, data);
        }
    }

    function isTrustedForwarder(address forwarder) public view virtual override returns (bool) {
        return forwarder == _trustedForwarder;
    }

    /**
     * @notice ERC-2771 Compatibility
     */
    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view virtual override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }

    /**
     * @notice External wrapper for _lzReceive to allow the simulation script to call it.
     */
    function simulateLzReceive(
        uint32 _srcEid,
        bytes32 _guid,
        bytes calldata _message
    ) external {
        _lzReceive(_srcEid, _guid, _message, msg.sender, bytes(""));
    }
}
