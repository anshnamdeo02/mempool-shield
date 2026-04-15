# Mempool-Shield: Commit-Reveal Protocol to Prevent Front-Running

Mempool-Shield is a complete demo project showing how commit-reveal protects users from front-running, transaction sniping, and gas-priority ordering attacks.

## What this project includes

- Solidity smart contract with sender-bound commit-reveal verification.
- Hardhat backend with deployment script and required tests.
- Node.js utilities for salt generation and commitment hashing.
- React frontend with Home, Commit, Reveal, and Simulation pages.
- Salt safety UX system to prevent accidental loss before reveal.

## Project structure

- contracts
- scripts
- test
- utils
- frontend

## Contract design

Contract: MempoolShield.sol

Core logic:

1. User submits commitment hash in commit phase.
2. User waits minimum 5 blocks.
3. User reveals action plus salt.
4. Contract recomputes: keccak256(abi.encodePacked(msg.sender, action, salt)).
5. Only matching sender can reveal successfully.

This sender-bound hash prevents copied commitments from being useful to attackers.

## Complete Setup Guide

Follow these steps in order. Open multiple terminal windows as indicated.

### Step 1: Install All Dependencies

Run this in your project root directory (one time only):

```powershell
npm install
npm --prefix frontend install
npm run compile
npm run test
```

**What happens:**
- `npm install` - installs Hardhat, Solidity compiler, testing frameworks
- `npm --prefix frontend install` - installs React, Vite, Ethers for frontend
- `npm run compile` - compiles MempoolShield.sol contract to bytecode
- `npm run test` - runs 5 tests including front-running vulnerability simulation (all should pass)

### Step 2: Start Local Blockchain

Open **Terminal 1** and run:

```powershell
npm run node
```

This starts a local Hardhat blockchain at `http://127.0.0.1:8545` on chain ID 31337.

**Keep this terminal running.** You will see 20 test accounts with 10,000 ETH each.

### Step 3: Deploy Smart Contract

Open **Terminal 2** and run:

```powershell
npm run deploy:localhost
```

**Output will show:**
```
MempoolShield deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
minRevealDelay blocks: 5
```

**Copy the deployed address** (e.g., `0x5FbDB...`). You will need it next.

### Step 4: Configure Frontend Environment

Still in **Terminal 2**, create the frontend env file with the address you just copied:

```powershell
Set-Content -Path ".\frontend\.env" -Value "VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3`nVITE_CHAIN_ID=31337"
```

Replace `0x5FbDB...` with your actual deployed address from Step 3.

### Step 5: Start Frontend Dev Server

Still in **Terminal 2**, run:

```powershell
npm run frontend
```

Output will show:
```
VITE v6.4.1 ready in 320 ms
Local: http://localhost:5173/
```

Open that URL in your browser.

### Step 6: Connect Wallet & Demo

In the browser app:

1. **Click "Connect Wallet"** - approve in Rabby/MetaMask
2. **Go to Commit page:**
   - Enter an action (e.g., `buy-100`)
   - Salt auto-generates
   - Save/copy/download salt
   - Tick "I have saved my salt"
   - Click Commit
   - Approve transaction in wallet
3. **Wait or mine blocks** (see Optional Commands below)
4. **Go to Reveal page:**
   - Enter same action and salt
   - Click Reveal
   - Approve transaction
   - See success message

### Optional Commands (Advanced)

If reveal says "too early", mine blocks immediately using **Terminal 3**:

```powershell
cd "C:\Users\anshn\Downloads\6th Sem\Blockchain\Project"
npx hardhat console --network localhost
```

Inside the Hardhat console, run:

```js
await network.provider.send("hardhat_mine", ["0x5"])
```

Then exit with `.exit` and try Reveal again in the app.

## Node utilities

Generate secure random salt:

npm run salt:generate

Create commitment hash:

npm run commitment:create -- <userAddress> <action> <salt>

Example:

npm run commitment:create -- 0xYourAddress buy-100 yourSaltString

## Frontend UX flow

### Commit page

- Input action.
- Salt generated automatically.
- Shows generated salt and commitment hash.
- Copy Salt button.
- Download Salt (.txt) button.
- Mandatory checkbox: I have saved my salt.
- Commit button disabled until checkbox is checked.
- Confirmation popup before submitting commit.
- Salt stored temporarily in localStorage.

### Reveal page

- Input action and salt.
- Reveal button sends transaction.
- Success or failure messages displayed.
- If no stored salt exists, shows:
  Salt not found. You cannot reveal your commitment.

## Simulation page behavior

Two clear demonstrations:

1. Without protection:
- User sends plain action.
- Attacker copies action and increases gas.
- Attacker is ordered first and wins.

2. With commit-reveal:
- User sends only hash.
- Attacker cannot decode action or salt.
- Even copied hash is useless because reveal hash is sender-bound.
- Original user reveals successfully after delay.

Simulation logs are displayed in the UI and printed to browser console.

## Edge case: lost salt

If the user loses salt, reveal cannot be recovered and transaction reveal must fail. This is expected security behavior and is explicitly warned in the UI.

## Demo checklist

1. Connect wallet.
2. Go to Commit page, enter action, save salt securely.
3. Submit commit transaction.
4. Wait at least 5 blocks.
5. Go to Reveal page and reveal with same action and salt.
6. Run Simulation page scenarios for comparison.

## Results And Measurements

Your professor wants evidence of real execution time and blockchain cost. Use this section to collect and paste numbers from your runs.

### What To Measure

1. Deployment gas cost
2. Commit gas cost
3. Reveal gas cost
4. Total commit-reveal flow time
5. Comparison against the vulnerable simulation flow

### Commands To Run

Run these commands from the project root:

```powershell
npm run test:gas
npm run benchmark
```

What each command does:

- `npm run test:gas` - runs the test suite with Hardhat gas reporter enabled, so you can see gas usage per test and function.
- `npm run benchmark` - deploys the contract on Hardhat's in-memory local chain, executes commit and reveal, and prints gas used plus elapsed time in JSON.

### Where To Paste The Results

Paste the output from `npm run benchmark` into a table in your final report or README.

Suggested table format:

| Metric | Value |
| --- | --- |
| Deployment Gas | fill in from benchmark output |
| Commit Gas | fill in from benchmark output |
| Reveal Gas | fill in from benchmark output |
| Total Flow Time (ms) | fill in from benchmark output |
| Minimum Delay (blocks) | 5 |

### Optional Comparison Section

Add a short comparison paragraph in your report:

- Without commit-reveal, a higher-gas attacker can move ahead in the mempool.
- With Mempool-Shield, the attacker still cannot reveal successfully because the hash is bound to `msg.sender` and the salt is hidden until reveal.
- Therefore, gas price alone is not enough to steal the transaction.

### Measured Local Results

These numbers were collected from the local Hardhat benchmark and gas-reported tests in this project.

| Metric | Value |
| --- | --- |
| Deployment Gas | 370,542 |
| Commit Gas | 70,252 |
| Reveal Gas | 52,653 |
| Total Commit-Reveal Flow Time | 51 ms |
| Minimum Delay | 5 blocks |

Gas reporter summary from `npm run test:gas`:

| Contract | Method | Average Gas |
| --- | --- | --- |
| MempoolShield | commit | 70,252 |
| MempoolShield | reveal | 52,635 |

### Notes For Final Submission

1. If you run into a Windows assertion after tests finish, the results are still valid because the test suite completed successfully before shutdown.
2. For best stability on Windows, use Node.js 20 LTS instead of Node.js 24.
3. Include screenshots or pasted console output of the benchmark table in your final report.

### Example Benchmark Workflow

1. Run `npm run benchmark`
2. Copy the JSON output into your report results section
3. If you also want the browser demo, then separately start `npm run node`, deploy locally, and run the frontend
