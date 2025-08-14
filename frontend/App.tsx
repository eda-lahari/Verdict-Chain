import { useState } from "react";
import { useWallet, WalletAdapterAccount, Wallet } from "@aptos-labs/wallet-adapter-react";
import IpfsNftUpload from "./components/IpfsNftUpload";

function App() {
  const { connected, account, connect, disconnect, wallets } = useWallet();
  const [showEvidenceManager, setShowEvidenceManager] = useState<boolean>(false);

  const handleConnectWallet = async () => {
    if (!connected) {
      try {
        if (!wallets || wallets.length === 0) {
          console.error("No wallets available to connect");
          return;
        }

        const walletToConnect: Wallet = wallets[0]; // first available wallet
        await connect(walletToConnect.name);
        setShowEvidenceManager(true); // show EvidenceManager after connecting
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
    } else {
      disconnect();
      setShowEvidenceManager(false);
    }
  };

  return (
    <div className="app-container" style={{ padding: "2rem", textAlign: "center" }}>
      <button
        onClick={handleConnectWallet}
        style={{
          padding: "1rem 2rem",
          fontSize: "1.1rem",
          borderRadius: "0.5rem",
          backgroundColor: connected ? "#e74c3c" : "#2c3e50",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          marginBottom: "2rem",
        }}
      >
        {connected ? "Disconnect Wallet" : "Connect Wallet"}
      </button>
     
      {connected && account && (
  <div>
    <p style={{ marginBottom: "1rem" }}>
      ✅ Wallet Connected:{" "}
      {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-6)}
    </p>

    {showEvidenceManager && <IpfsNftUpload />}
  </div>
)}

    </div>
  );
}

export default App;
