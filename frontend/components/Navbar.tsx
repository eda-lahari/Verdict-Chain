import { Link } from "react-router-dom";
import "./css/Navbar.css";

export default function Navbar() {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e5e5',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: '#333',
          textDecoration: 'none' 
        }}>
          Verdict-Chain ⚖️
        </Link>
        
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#666', padding: '0.5rem' }}>
            Home
          </Link>
          <Link to="/evidence" style={{ textDecoration: 'none', color: '#666', padding: '0.5rem' }}>
            Evidence
          </Link>
        </div>
      </div>
    </nav>
  );
}
