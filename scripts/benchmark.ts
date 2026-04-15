import { ethers, network } from "hardhat";

async function mineBlocks(blockCount: number) {
  await network.provider.send("hardhat_mine", [`0x${blockCount.toString(16)}`]);
}

async function main() {
  const [deployer, user] = await ethers.getSigners();
  const action = "buy-100";
  const salt = "benchmark-salt";
  const minDelayBlocks = 5;

  const Factory = await ethers.getContractFactory("MempoolShield");
  const deploymentStart = Date.now();
  const contract = await Factory.deploy(minDelayBlocks);
  const deploymentTx = await contract.deploymentTransaction()?.wait();
  await contract.waitForDeployment();
  const deploymentMs = Date.now() - deploymentStart;

  if (!deploymentTx) {
    throw new Error("Failed to collect deployment receipt.");
  }

  const commitment = ethers.solidityPackedKeccak256(
    ["address", "string", "string"],
    [user.address, action, salt]
  );

  const commitStart = Date.now();
  const commitTx = await contract.connect(user).commit(commitment);
  const commitReceipt = await commitTx.wait();
  const commitMs = Date.now() - commitStart;

  await mineBlocks(minDelayBlocks);

  const revealStart = Date.now();
  const revealTx = await contract.connect(user).reveal(action, salt);
  const revealReceipt = await revealTx.wait();
  const revealMs = Date.now() - revealStart;

  const results = {
    network: network.name,
    deployer: deployer.address,
    contractAddress: await contract.getAddress(),
    deployment: {
      gasUsed: deploymentTx.gasUsed.toString(),
      ms: deploymentMs
    },
    commit: {
      gasUsed: commitReceipt?.gasUsed?.toString() ?? "0",
      ms: commitMs
    },
    reveal: {
      gasUsed: revealReceipt?.gasUsed?.toString() ?? "0",
      ms: revealMs
    },
    totalFlowMs: deploymentMs + commitMs + revealMs,
    minDelayBlocks
  };

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
