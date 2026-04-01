import { useState } from "react";

const noProtectionScenario = [
  "User submits plain action: BUY_NFT at price X.",
  "Attacker sees transaction in mempool and copies action.",
  "Attacker increases gas price to jump ordering.",
  "Miner includes attacker tx first.",
  "Attacker wins. User loses opportunity."
];

const protectedScenario = [
  "User submits commitment hash only.",
  "Attacker sees hash but cannot decode action or salt.",
  "Attacker may copy hash but reveal requires sender-bound preimage.",
  "After delay, original user reveals action + salt.",
  "Contract validates hash with msg.sender. Attacker cannot hijack."
];

export default function SimulationPage() {
  const [logsA, setLogsA] = useState<string[]>([]);
  const [logsB, setLogsB] = useState<string[]>([]);

  const playNoProtection = () => {
    setLogsB([]);
    setLogsA(noProtectionScenario);
    noProtectionScenario.forEach((line) => console.log(`[UNPROTECTED] ${line}`));
  };

  const playProtection = () => {
    setLogsA([]);
    setLogsB(protectedScenario);
    protectedScenario.forEach((line) => console.log(`[COMMIT-REVEAL] ${line}`));
  };

  return (
    <section className="card grid2">
      <div>
        <h2>Without Protection</h2>
        <button className="btn" onClick={playNoProtection}>Run Attack Simulation</button>
        <ul>
          {logsA.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2>With Commit-Reveal Protection</h2>
        <button className="btn primary" onClick={playProtection}>Run Protected Simulation</button>
        <ul>
          {logsB.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
