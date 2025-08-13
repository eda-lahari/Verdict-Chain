import { Link } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "./WalletSelector";
import "./Home.css";

interface HomeProps {
  totalEvidence: number;
}

export default function Home({ totalEvidence }: HomeProps) {
  const { connected, account } = useWallet();

  return (
    <div className="home-container">
      {/* WALLET CONNECTION TEST - Remove this after testing */}
      <div style={{ 
        padding: '20px', 
        margin: '20px auto', 
        maxWidth: '600px',
        border: '2px solid #007bff',
        borderRadius: '10px',
        backgroundColor: '#f8f9fa',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#007bff' }}>🧪 Wallet Connection Test</h3>
        
        <WalletSelector />
        
        <div style={{ marginTop: '15px' }}>
          {connected ? (
            <div style={{ 
              padding: '10px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '5px',
              color: '#155724'
            }}>
              <strong>✅ Wallet Connected Successfully!</strong>
              <br />
              <small>Address: {account?.address.toString().slice(0, 10)}...{account?.address.toString().slice(-8)}</small>
            </div>
          ) : (
            <div style={{ 
              padding: '10px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '5px',
              color: '#856404'
            }}>
              ⚠️ Please connect your Petra wallet to use blockchain features
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">Secure, Immutable Evidence on Blockchain</h1>
        <p className="hero-subtitle">
          Upload, verify, and manage evidence safely using blockchain technology.
        </p>
        <div className="hero-buttons">
          <Link to="/upload" className="btn-primary">
            Upload Evidence
          </Link>
          <Link to="/view" className="btn-secondary">
            View Evidence
          </Link>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="dashboard-section">
        <h2 className="dashboard-title">Dashboard</h2>
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <p className="card-title">Total Evidence Uploaded</p>
            <p className="card-value">{totalEvidence}</p>
          </div>
          
          {/* Wallet Status Card */}
          <div className="dashboard-card">
            <p className="card-title">Wallet Status</p>
            <p className="card-value" style={{ 
              color: connected ? '#28a745' : '#dc3545',
              fontSize: '14px'
            }}>
              {connected ? '✅ Connected' : '❌ Disconnected'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}