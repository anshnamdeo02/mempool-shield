import { useEffect, useState } from "react";
import { createCommitmentHash, sendCommit } from "../services/contract";
import { generateSalt } from "../services/crypto";
import { saveSaltData } from "../services/storage";

type Props = { wallet: string };

export default function CommitPage({ wallet }: Props) {
  const [action, setAction] = useState("");
  const [salt, setSalt] = useState(() => generateSalt());
  const [savedAck, setSavedAck] = useState(false);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");

  const [commitment, setCommitment] = useState("");

  useEffect(() => {
    void (async () => {
      if (!wallet || !action || !salt) {
        setCommitment("");
        return;
      }
      const value = await createCommitmentHash(wallet, action, salt);
      setCommitment(value);
    })();
  }, [wallet, action, salt]);

  const copySalt = async () => {
    await navigator.clipboard.writeText(salt);
    setStatus("Salt copied to clipboard.");
  };

  const downloadSalt = () => {
    const blob = new Blob([salt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mempool-shield-salt.txt";
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Salt downloaded as text file.");
  };

  const handleCommit = async () => {
    if (!wallet) {
      setStatus("Connect wallet before committing.");
      return;
    }
    if (!action.trim()) {
      setStatus("Action is required.");
      return;
    }
    if (!savedAck) {
      setStatus("Please confirm that you saved your salt.");
      return;
    }

    const confirmed = window.confirm("Have you saved your salt? This cannot be recovered.");
    if (!confirmed) return;

    try {
      setStatus("Submitting commit transaction...");
      saveSaltData(action, salt);
      const hash = await sendCommit(commitment);
      setTxHash(hash);
      setStatus("Commit successful.");
    } catch (e) {
      setStatus(`Commit failed: ${(e as Error).message}`);
    }
  };

  const regenerateSalt = () => {
    setSalt(generateSalt());
    setSavedAck(false);
    setStatus("Generated a new salt.");
  };

  return (
    <section className="card">
      <h2>Commit</h2>
      <label>Action</label>
      <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="buy-100" />

      <label>Generated Salt</label>
      <textarea value={salt} readOnly rows={3} />

      <p className="warning">
        IMPORTANT: Save this salt securely. If you lose it, you will NOT be able to reveal your
        transaction.
      </p>

      <div className="row">
        <button className="btn" onClick={regenerateSalt}>Generate New Salt</button>
        <button className="btn" onClick={copySalt}>Copy Salt</button>
        <button className="btn" onClick={downloadSalt}>Download Salt (.txt)</button>
      </div>

      <label>Commitment Hash</label>
      <textarea value={commitment} readOnly rows={3} />

      <label className="check">
        <input type="checkbox" checked={savedAck} onChange={(e) => setSavedAck(e.target.checked)} />
        I have saved my salt
      </label>

      <button className="btn primary" disabled={!savedAck || !commitment} onClick={handleCommit}>
        Commit
      </button>

      {status && <p>{status}</p>}
      {txHash && <p>Tx Hash: {txHash}</p>}
    </section>
  );
}
