import { useEffect, useState } from "react";
import { sendReveal } from "../services/contract";
import { getStoredAction, getStoredSalt } from "../services/storage";

type Props = { wallet: string };

export default function RevealPage({ wallet }: Props) {
  const [action, setAction] = useState("");
  const [salt, setSalt] = useState("");
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    const storedSalt = getStoredSalt();
    const storedAction = getStoredAction();

    if (!storedSalt) {
      setStatus("Salt not found. You cannot reveal your commitment.");
      return;
    }

    setSalt(storedSalt);
    if (storedAction) setAction(storedAction);
  }, []);

  const onReveal = async () => {
    if (!wallet) {
      setStatus("Connect wallet before reveal.");
      return;
    }
    if (!action.trim() || !salt.trim()) {
      setStatus("Action and salt are required.");
      return;
    }

    try {
      setStatus("Submitting reveal transaction...");
      const hash = await sendReveal(action, salt);
      setTxHash(hash);
      setStatus("Reveal successful.");
    } catch (e) {
      setStatus(`Reveal failed: ${(e as Error).message}`);
    }
  };

  return (
    <section className="card">
      <h2>Reveal</h2>
      <label>Action</label>
      <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="buy-100" />

      <label>Salt</label>
      <textarea value={salt} onChange={(e) => setSalt(e.target.value)} rows={3} />

      <button className="btn primary" onClick={onReveal}>Reveal</button>

      {status && <p>{status}</p>}
      {txHash && <p>Tx Hash: {txHash}</p>}
    </section>
  );
}
