const { ethers } = require("ethers");

function createCommitment(userAddress, action, salt) {
  return ethers.solidityPackedKeccak256(
    ["address", "string", "string"],
    [userAddress, action, salt]
  );
}

if (require.main === module) {
  const [, , userAddress, action, salt] = process.argv;

  if (!userAddress || !action || !salt) {
    console.error("Usage: node utils/createCommitment.js <userAddress> <action> <salt>");
    process.exit(1);
  }

  const commitment = createCommitment(userAddress, action, salt);
  console.log(commitment);
}

module.exports = { createCommitment };
