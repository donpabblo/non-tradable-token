// SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.0;

import "./ERC4671.sol";

contract NTT is ERC4671 {
    constructor(string memory name_, string memory symbol_)
        ERC4671(name_, symbol_)
    {}

    function mint(address owner) public {
        require(_isCreator(), "Only Contract creator can mint");
        ERC4671._mint(owner);
    }

    function revoke(uint256 tokenId) public {
        require(_isCreator(), "Only Contract creator can revoke");
        ERC4671._revoke(tokenId);
    }

    function _baseURI() internal pure virtual override returns (string memory) {
        return "http://localhost/";
    }
}
