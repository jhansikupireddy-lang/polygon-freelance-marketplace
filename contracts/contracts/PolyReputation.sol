// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PolyReputation
 * @dev Soulbound Token (SBT) for user reputation on PolyLance.
 * Compliant with ERC-5192 Minimal Soulbound NFTs.
 */
contract PolyReputation is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);

    mapping(address => uint256) public userReputation;
    mapping(uint256 => bool) private _locked;

    constructor(address initialOwner) ERC721("PolyLance Reputation", "PREP") Ownable(initialOwner) {}

    function mintReputation(address to, string memory uri, uint256 reputationScore) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        userReputation[to] += reputationScore;
        
        _locked[tokenId] = true;
        emit Locked(tokenId);
    }

    function locked(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        return _locked[tokenId];
    }

    // Soulbound logic: Prevent transfers
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Only allow minting (from == 0) and burning (to == 0)
        if (from != address(0) && to != address(0)) {
            revert("SBT: Transfers are disabled");
        }
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId); // 0xb45a3c0e is ERC-5192 interfaceId
    }
}
