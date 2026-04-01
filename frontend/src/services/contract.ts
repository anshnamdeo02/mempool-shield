import { BrowserProvider, Contract, ethers } from "ethers";

const abi = [
  "function commit(bytes32 _commitment)",
  "function reveal(string action, string salt)",
  "function getCommit(address user) view returns (bytes32 commitment, uint256 blockNumber, bool revealed)",
  "function minRevealDelay() view returns (uint256)",
  "event Committed(address indexed user, bytes32 commitment)",
  "event Revealed(address indexed user, string action)"
];

const DEFAULT_CHAIN_ID = 31337n;

const ERROR_SELECTOR_MAP: Record<string, string> = {
  "0xcfc1671a": "You already have an active commit. Reveal it first before creating a new commit.",
  "0x6ad833a8": "No commit found for this wallet. Create a commit first.",
  "0xa89ac151": "This commit was already revealed.",
  "0x9ea6d127": "Invalid reveal. Action or salt does not match your original commit."
};

function getEthereumProvider(): unknown {
  const eth = (window as Window & { ethereum?: unknown }).ethereum;
  if (!eth) {
    throw new Error("MetaMask not found. Install MetaMask to continue.");
  }
  return eth;
}

async function getBrowserProvider(): Promise<BrowserProvider> {
  return new BrowserProvider(getEthereumProvider() as ethers.Eip1193Provider);
}

function decodeError(error: unknown): string {
  const err = error as {
    message?: string;
    shortMessage?: string;
    data?: string;
    info?: { error?: { data?: string } };
  };

  const rawData =
    (typeof err?.data === "string" && err.data.startsWith("0x") ? err.data : undefined) ??
    (typeof err?.info?.error?.data === "string" && err.info.error.data.startsWith("0x")
      ? err.info.error.data
      : undefined) ??
    (() => {
      const text = String(err?.shortMessage ?? err?.message ?? "");
      const match = text.match(/return data:\s*(0x[0-9a-fA-F]+)/);
      return match?.[1];
    })();

  if (!rawData || rawData.length < 10) {
    const text = String(err?.shortMessage ?? err?.message ?? "");
    if (text.toLowerCase().includes("missing revert data")) {
      return "Transaction reverted without reason data. Check that you are on chainId 31337 and VITE_CONTRACT_ADDRESS points to a deployed contract on this network.";
    }
    return String(err?.shortMessage ?? err?.message ?? "Transaction failed.");
  }

  const selector = rawData.slice(0, 10).toLowerCase();

  if (selector === "0xc167e8fa") {
    try {
      const payload = `0x${rawData.slice(10)}`;
      const [current, required] = ethers.AbiCoder.defaultAbiCoder().decode(
        ["uint256", "uint256"],
        payload
      ) as unknown as [bigint, bigint];
      const remaining = required > current ? required - current : 0n;
      return `Reveal is too early. Wait about ${remaining.toString()} more block(s), then reveal.`;
    } catch {
      return "Reveal is too early. Wait a few more blocks and try again.";
    }
  }

  return ERROR_SELECTOR_MAP[selector] ?? "Transaction reverted by the contract.";
}

function getExpectedChainId(): bigint {
  const raw = import.meta.env.VITE_CHAIN_ID;
  if (!raw) return DEFAULT_CHAIN_ID;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid VITE_CHAIN_ID in frontend environment.");
  }
  return BigInt(parsed);
}

async function ensureCorrectNetwork(provider: BrowserProvider): Promise<void> {
  const expected = getExpectedChainId();
  const current = (await provider.getNetwork()).chainId;
  if (current === expected) return;

  const ethereum = getEthereumProvider() as ethers.Eip1193Provider;
  const chainHex = `0x${expected.toString(16)}`;

  try {
    await ethereum.request?.({ method: "wallet_switchEthereumChain", params: [{ chainId: chainHex }] });
  } catch {
    throw new Error(
      `Wrong network selected. Please switch MetaMask to chainId ${expected.toString()} (Localhost 8545 for Hardhat).`
    );
  }
}

export async function getConnectedAddress(): Promise<string | null> {
  if (!(window as Window & { ethereum?: unknown }).ethereum) return null;
  const provider = await getBrowserProvider();
  const accounts = await provider.send("eth_accounts", []);
  return accounts.length > 0 ? accounts[0] : null;
}

export async function connectWallet(): Promise<string> {
  const provider = await getBrowserProvider();
  await ensureCorrectNetwork(provider);
  const accounts = await provider.send("eth_requestAccounts", []);
  if (!accounts || accounts.length === 0) {
    throw new Error("No account returned from wallet.");
  }
  return accounts[0];
}

function getAddress(): string {
  const address = import.meta.env.VITE_CONTRACT_ADDRESS;
  if (!address || !ethers.isAddress(address)) {
    throw new Error("Invalid or missing VITE_CONTRACT_ADDRESS in frontend environment.");
  }
  return address;
}

async function getContractWithSigner(): Promise<Contract> {
  const provider = await getBrowserProvider();
  await ensureCorrectNetwork(provider);
  const address = getAddress();
  const code = await provider.getCode(address);
  if (!code || code === "0x") {
    throw new Error(
      "No contract found at configured address on this network. Run deploy again and update frontend/.env."
    );
  }
  const signer = await provider.getSigner();
  return new Contract(address, abi, signer);
}

async function getReadOnlyContract(): Promise<Contract> {
  const provider = await getBrowserProvider();
  return new Contract(getAddress(), abi, provider);
}

export async function createCommitmentHash(user: string, action: string, salt: string): Promise<string> {
  return ethers.solidityPackedKeccak256(["address", "string", "string"], [user, action, salt]);
}

export async function sendCommit(commitment: string): Promise<string> {
  try {
    const contract = await getContractWithSigner();
    const tx = await contract.commit(commitment);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    throw new Error(decodeError(error));
  }
}

export async function sendReveal(action: string, salt: string): Promise<string> {
  try {
    const contract = await getContractWithSigner();
    const tx = await contract.reveal(action, salt);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    throw new Error(decodeError(error));
  }
}

export async function fetchCommit(address: string) {
  const contract = await getReadOnlyContract();
  const data = await contract.getCommit(address);
  return {
    commitment: data[0] as string,
    blockNumber: Number(data[1]),
    revealed: Boolean(data[2])
  };
}
