// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract PolyToken is ERC20, ERC20Permit, ERC20Votes, AccessControl, Ownable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address initialOwner) 
        ERC20("PolyLance Token", "POLY") 
        ERC20Permit("PolyLance Token")
        Ownable(initialOwner) 
    {
        _mint(initialOwner, 1_000_000_000 * 10 ** decimals()); // 1 Billion Supply
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
    }

    function setMinter(address _minter, bool _allowed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_allowed) {
            _grantRole(MINTER_ROLE, _minter);
        } else {
            _revokeRole(MINTER_ROLE, _minter);
        }
    }

    function mint(address _to, uint256 _amount) external onlyRole(MINTER_ROLE) {
        _mint(_to, _amount);
    }

    // The functions below are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
