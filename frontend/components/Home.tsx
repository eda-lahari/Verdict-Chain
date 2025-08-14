import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "./WalletSelector";
import "./Home.css";

interface HomeProps {
  totalEvidence: number;
}

export default function Home({ totalEvidence }: HomeProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { connected, account } = useWallet();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleUploadClick = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  return (
    <div className="home-container">
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-text">🎉 Great Choice! 🎉</div>
        </div>
      )}

      <div className={`wallet-test-section ${isLoaded ? "fade-in" : ""}`}>
        <h3 className="wallet-test-title">🧪 Wallet Connection Test</h3>
        <WalletSelector />
        <div className="wallet-status-container">
          {connected ? (
            <div className="connection-status connected">
              <strong>✅ Wallet Connected Successfully!</strong>
              <br />
              <small>
                Address:{" "}
                {account?.address.toString().slice(0, 10)}...
                {account?.address.toString().slice(-8)}
              </small>
            </div>
          ) : (
            <div className="connection-status disconnected">
              ⚠ Please connect your wallet to use blockchain features
            </div>
          )}
        </div>
      </div>

      <section className={`hero-section ${isLoaded ? "slide-in" : ""}`}>
        <h1 className="hero-title">Secure, Immutable Evidence on Blockchain</h1>
        <p className="hero-subtitle">
          Upload, verify, and manage evidence safely using blockchain technology.
        </p>
        <div className="hero-buttons">
          <Link
            to="/upload"
            onClick={handleUploadClick}
            className="btn-primary pulse-hover"
          >
            Upload Evidence
          </Link>
          <Link to="/evidence" className="btn-secondary">
            View Evidence
          </Link>
        </div>
      </section>

      <section className="dashboard-section">
        <h2 className="dashboard-title">Dashboard</h2>
        <div className={`dashboard-cards ${isLoaded ? "stagger-in" : ""}`}>
          <div className="dashboard-card hover-lift">
            <p className="card-title">Total Evidence Uploaded</p>
            <p className="card-value">{totalEvidence}</p>
          </div>
          <div className="dashboard-card hover-lift wallet-status-card">
            <p className="card-title">Wallet Status</p>
            <p
              className={`card-value wallet-status ${
                connected ? "connected" : "disconnected"
              }`}
            >
              {connected ? "✅ Connected" : "❌ Disconnected"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
