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

## Setup instructions

### 1) Install dependencies

From project root:

npm install
npm --prefix frontend install

### 2) Compile contracts

npm run compile

### 3) Run tests

npm run test

Covered tests:

1. Normal flow: commit then delayed reveal succeeds.
2. Early reveal: fails before delay.
3. Wrong salt: fails with invalid reveal.
4. Double commit: blocked before reveal.
5. Front-running simulation: attacker copies commitment but cannot reveal as victim.

### 4) Deploy locally

Terminal 1:

npm run node

Terminal 2:

npm run deploy:localhost

Copy the deployed contract address from terminal output.

### 5) Configure frontend

Create frontend/.env file:

VITE_CONTRACT_ADDRESS=PASTE_DEPLOYED_ADDRESS_HERE

### 6) Run frontend

npm run frontend

Open the URL shown by Vite, usually http://localhost:5173.

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
