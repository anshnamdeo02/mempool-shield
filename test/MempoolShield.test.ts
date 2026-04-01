import { expect } from "chai";
import { ethers, network } from "hardhat";
import { MempoolShield, MempoolShield__factory } from "../typechain-types";

async function mineBlocks(count: number) {
  const hexCount = `0x${count.toString(16)}`;
  await network.provider.send("hardhat_mine", [hexCount]);
}

describe("MempoolShield", function () {
  const minDelay = 5;

  async function deployFixture() {
    const [deployer, user, attacker] = await ethers.getSigners();
    const factory = (await ethers.getContractFactory("MempoolShield")) as unknown as MempoolShield__factory;
    const shield = (await factory.deploy(minDelay)) as MempoolShield;
    await shield.waitForDeployment();

    return { shield, deployer, user, attacker };
  }

  it("normal flow: commit -> wait -> reveal succeeds", async function () {
    const { shield, user } = await deployFixture();
    const action = "buy-100";
    const salt = "salt-123";

    const commitment = ethers.solidityPackedKeccak256(
      ["address", "string", "string"],
      [user.address, action, salt]
    );

    await expect(shield.connect(user).commit(commitment))
      .to.emit(shield, "Committed")
      .withArgs(user.address, commitment);

    await mineBlocks(minDelay);

    await expect(shield.connect(user).reveal(action, salt))
      .to.emit(shield, "Revealed")
      .withArgs(user.address, action);

    const data = await shield.getCommit(user.address);
    expect(data.revealed).to.equal(true);
  });

  it("early reveal should fail", async function () {
    const { shield, user } = await deployFixture();
    const action = "stake";
    const salt = "timelock";

    const commitment = ethers.solidityPackedKeccak256(
      ["address", "string", "string"],
      [user.address, action, salt]
    );

    await shield.connect(user).commit(commitment);

    await expect(shield.connect(user).reveal(action, salt)).to.be.revertedWithCustomError(
      shield,
      "RevealTooEarly"
    );
  });

  it("wrong salt should fail", async function () {
    const { shield, user } = await deployFixture();
    const action = "sell-50";
    const correctSalt = "correct-salt";

    const commitment = ethers.solidityPackedKeccak256(
      ["address", "string", "string"],
      [user.address, action, correctSalt]
    );

    await shield.connect(user).commit(commitment);
    await mineBlocks(minDelay);

    await expect(shield.connect(user).reveal(action, "wrong-salt")).to.be.revertedWithCustomError(
      shield,
      "InvalidReveal"
    );
  });

  it("double commit before reveal should fail", async function () {
    const { shield, user } = await deployFixture();

    const firstCommitment = ethers.solidityPackedKeccak256(
      ["address", "string", "string"],
      [user.address, "a1", "s1"]
    );

    const secondCommitment = ethers.solidityPackedKeccak256(
      ["address", "string", "string"],
      [user.address, "a2", "s2"]
    );

    await shield.connect(user).commit(firstCommitment);

    await expect(shield.connect(user).commit(secondCommitment)).to.be.revertedWithCustomError(
      shield,
      "ActiveCommitExists"
    );
  });

  it("front-running simulation: attacker copies commitment but cannot reveal as victim", async function () {
    const { shield, user, attacker } = await deployFixture();
    const action = "purchase-nft";
    const salt = "ultra-secret";

    const userCommitment = ethers.solidityPackedKeccak256(
      ["address", "string", "string"],
      [user.address, action, salt]
    );

    // Victim commits first.
    await shield.connect(user).commit(userCommitment);

    // Attacker sees the hash in mempool and copies it.
    await shield.connect(attacker).commit(userCommitment);

    await mineBlocks(minDelay);

    // Attacker cannot reveal with victim preimage because msg.sender is attacker.
    await expect(shield.connect(attacker).reveal(action, salt)).to.be.revertedWithCustomError(
      shield,
      "InvalidReveal"
    );

    // Victim still reveals successfully.
    await expect(shield.connect(user).reveal(action, salt))
      .to.emit(shield, "Revealed")
      .withArgs(user.address, action);
  });
});
