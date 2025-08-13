import { Link } from "react-router-dom";
import "./css/Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">Verdict-Chain</div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/upload">Upload Evidence</Link>
        <Link to="/view">View Evidence</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </nav>
  );
}
