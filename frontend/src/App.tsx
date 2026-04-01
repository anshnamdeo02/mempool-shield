import { NavLink, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { connectWallet, getConnectedAddress } from "./services/contract.ts";
import HomePage from "./pages/HomePage.tsx";
import CommitPage from "./pages/CommitPage.tsx";
import RevealPage from "./pages/RevealPage.tsx";
import SimulationPage from "./pages/SimulationPage.tsx";

export default function App() {
  const [wallet, setWallet] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    void (async () => {
      const current = await getConnectedAddress();
      setWallet(current ?? "");
    })();
  }, []);

  const onConnect = async () => {
    try {
      setError("");
      const address = await connectWallet();
      setWallet(address);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="shell">
      <header className="topbar">
        <h1>Mempool-Shield</h1>
        <button className="btn" onClick={onConnect}>
          {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect Wallet"}
        </button>
      </header>

      <nav className="nav">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/commit">Commit</NavLink>
        <NavLink to="/reveal">Reveal</NavLink>
        <NavLink to="/simulation">Simulation</NavLink>
      </nav>

      {error && <p className="error">{error}</p>}

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/commit" element={<CommitPage wallet={wallet} />} />
          <Route path="/reveal" element={<RevealPage wallet={wallet} />} />
          <Route path="/simulation" element={<SimulationPage />} />
        </Routes>
      </main>
    </div>
  );
}
