import { Link } from "react-router-dom";
import "./Home.css";

interface HomeProps {
  totalEvidence: number;
}

export default function Home({ totalEvidence }: HomeProps) {
  return (
    <div className="home-container">
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
        </div>
      </section>
    </div>
  );
}
