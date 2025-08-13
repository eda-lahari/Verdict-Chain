import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useState } from "react";
import "./Home.css";

interface HomeProps {
  totalEvidence: number;
}

export default function Home({ totalEvidence }: HomeProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  const handleUploadClick = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000); // 3s confetti
  };

  return (
    <div className="home-container">
      {showConfetti && <Confetti />}

      {/* Hero Section */}
      <motion.section
        className="hero-section"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="hero-title">Secure, Immutable Evidence on Blockchain</h1>
        <p className="hero-subtitle">
          Upload, verify, and manage evidence safely using blockchain technology.
        </p>
        <div className="hero-buttons">
          <Link
            to="/upload"
            onClick={handleUploadClick}
            className="btn-primary"
          >
            Upload Evidence
          </Link>
          <Link to="/view" className="btn-secondary">
            View Evidence
          </Link>
        </div>
      </motion.section>

      {/* Dashboard Section */}
      <section className="dashboard-section">
        <h2 className="dashboard-title">Dashboard</h2>
        <motion.div
          className="dashboard-cards"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.2
              }
            }
          }}
        >
          <motion.div
            className="dashboard-card"
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="card-title">Total Evidence Uploaded</p>
            <p className="card-value">{totalEvidence}</p>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
