// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MempoolShield {
    struct CommitData {
        bytes32 commitment;
        uint256 blockNumber;
        bool revealed;
    }

    mapping(address => CommitData) private commits;
    uint256 public immutable minRevealDelay;

    event Committed(address indexed user, bytes32 commitment);
    event Revealed(address indexed user, string action);

    error ActiveCommitExists();
    error NoCommitFound();
    error AlreadyRevealed();
    error RevealTooEarly(uint256 currentBlock, uint256 requiredBlock);
    error InvalidReveal();

    constructor(uint256 _minRevealDelay) {
        minRevealDelay = _minRevealDelay;
    }

    function commit(bytes32 _commitment) external {
        CommitData memory existing = commits[msg.sender];
        if (existing.commitment != bytes32(0) && !existing.revealed) {
            revert ActiveCommitExists();
        }

        commits[msg.sender] = CommitData({
            commitment: _commitment,
            blockNumber: block.number,
            revealed: false
        });

        emit Committed(msg.sender, _commitment);
    }

    function reveal(string memory action, string memory salt) external {
        CommitData storage data = commits[msg.sender];

        if (data.commitment == bytes32(0)) {
            revert NoCommitFound();
        }
        if (data.revealed) {
            revert AlreadyRevealed();
        }

        uint256 requiredBlock = data.blockNumber + minRevealDelay;
        if (block.number < requiredBlock) {
            revert RevealTooEarly(block.number, requiredBlock);
        }

        bytes32 computed = keccak256(abi.encodePacked(msg.sender, action, salt));
        if (computed != data.commitment) {
            revert InvalidReveal();
        }

        data.revealed = true;

        emit Revealed(msg.sender, action);
    }

    function getCommit(address user)
        external
        view
        returns (bytes32 commitment, uint256 blockNumber, bool revealed)
    {
        CommitData memory data = commits[user];
        return (data.commitment, data.blockNumber, data.revealed);
    }
}
