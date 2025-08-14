import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "./components/WalletSelector";
import IpfsNftUpload from "./components/IpfsNftUpload";

function Home() {
  const { connected, account } = useWallet();
  
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Verdict-Chain Home</h1>
      
      <div style={{ 
        margin: '2rem auto', 
        padding: '1rem', 
        border: '2px solid #007bff', 
        borderRadius: '10px',
        maxWidth: '400px'
      }}>
        <h3>🦋 Connect Wallet</h3>
        <WalletSelector />
        
        {connected && account && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.5rem', 
            backgroundColor: '#d4edda', 
            borderRadius: '5px' 
          }}>
            ✅ Connected: {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-6)}
          </div>
        )}
      </div>
      
      <a href="/upload" style={{ 
        display: 'inline-block', 
        padding: '1rem 2rem', 
        backgroundColor: '#007bff', 
        color: 'white', 
        textDecoration: 'none', 
        borderRadius: '5px'
      }}>
        Upload Evidence
      </a>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<IpfsNftUpload />} />
      </Routes>
    </Router>
  );
}

export default App;