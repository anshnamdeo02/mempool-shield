import { ethers } from "hardhat";

async function main() {
  const minDelayBlocks = 5;

  const Factory = await ethers.getContractFactory("MempoolShield");
  const contract = await Factory.deploy(minDelayBlocks);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`MempoolShield deployed to: ${address}`);
  console.log(`minRevealDelay blocks: ${minDelayBlocks}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
