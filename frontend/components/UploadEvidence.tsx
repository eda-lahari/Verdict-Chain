import React, { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { MODULE_ADDRESS, NETWORK } from "../constants";
import "./css/Evidence.css";

// Initialize Aptos client
const aptosConfig = new AptosConfig({ 
  network: NETWORK as Network,
});
const aptos = new Aptos(aptosConfig);

interface UploadEvidenceProps {
  setTotalEvidence: React.Dispatch<React.SetStateAction<number>>;
}

export default function UploadEvidence({ setTotalEvidence }: UploadEvidenceProps) {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [caseId, setCaseId] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");

  // Mock functions - replace with your friend's IPFS functions
  const mockUploadToIPFS = async (file: File): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload
    return `QmMock${Date.now()}`; // Mock IPFS hash
  };

  const mockSha256 = async (file: File): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate hashing
    return `0x${Math.random().toString(16).substring(2, 66)}`; // Mock 64-char hash
  };

  const handleUpload = async () => {
    if (!connected) {
      alert("Please connect your Petra wallet first!");
      return;
    }

    if (!file || !caseId.trim()) {
      alert("Select a file and enter case ID first!");
      return;
    }

    if (!MODULE_ADDRESS) {
      alert("Module address not configured!");
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Upload to IPFS
      setStatus("📤 Uploading to IPFS...");
      const ipfsHash = await mockUploadToIPFS(file); // Replace with your friend's function
      
      // Step 2: Generate hash
      setStatus("🔐 Generating hash...");
      const fileHash = await mockSha256(file); // Replace with your friend's function

      // Step 3: Store on blockchain
      setStatus("⛓️ Storing on blockchain...");
      
      const transaction = await signAndSubmitTransaction({
        sender: account!.address,
        data: {
          function: `${MODULE_ADDRESS}::EvidenceRegister::register_evidence`,
          functionArguments: [
            caseId.trim(),
            fileHash,
            `File: ${file.name}, IPFS: ${ipfsHash}`
          ],
        },
      });

      setStatus("⏳ Confirming...");
      
      await aptos.waitForTransaction({
        transactionHash: transaction.hash,
      });

      setStatus("✅ Evidence stored on blockchain!");
      
      // Increment total evidence count
      setTotalEvidence(prev => prev + 1);
      
      // Reset form after success
      setTimeout(() => {
        setFile(null);
        setCaseId("");
        setStatus("");
      }, 2000);

    } catch (error) {
      console.error("Upload error:", error);
      setStatus("❌ Upload failed!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="evidence-container">
      <h2>Upload Evidence to Blockchain</h2>
      
      {/* Wallet Connection Status */}
      <div style={{ 
        marginBottom: '20px',
        padding: '10px',
        borderRadius: '5px',
        backgroundColor: connected ? '#d4edda' : '#fff3cd',
        border: `1px solid ${connected ? '#c3e6cb' : '#ffeaa7'}`
      }}>
        {connected ? (
          <span style={{ color: '#155724' }}>
            ✅ Wallet Connected: {account?.address.toString().slice(0, 10)}...
          </span>
        ) : (
          <span style={{ color: '#856404' }}>
            ⚠️ Please connect your wallet to upload evidence
          </span>
        )}
      </div>

      {/* Case ID Input */}
      <input 
        type="text"
        placeholder="Enter Case ID"
        value={caseId}
        onChange={(e) => setCaseId(e.target.value)}
        style={{ 
          width: '100%', 
          padding: '10px', 
          marginBottom: '15px',
          border: '1px solid #ddd',
          borderRadius: '5px'
        }}
      />
      
      {/* File Input */}
      <input 
        type="file" 
        onChange={e => setFile(e.target.files?.[0] || null)}
        style={{ marginBottom: '15px' }}
      />
      
      {/* Upload Button */}
      <button 
        onClick={handleUpload} 
        className="btn-primary"
        disabled={!connected || isUploading}
        style={{
          opacity: connected && !isUploading ? 1 : 0.6,
          cursor: connected && !isUploading ? 'pointer' : 'not-allowed'
        }}
      >
        {isUploading ? 'Uploading...' : 'Upload to Blockchain'}
      </button>

      {/* Status Display */}
      {status && (
        <div style={{ 
          marginTop: '15px',
          padding: '10px',
          borderRadius: '5px',
          backgroundColor: status.includes('✅') ? '#d4edda' : 
                           status.includes('❌') ? '#f8d7da' : '#fff3cd',
          border: `1px solid ${
            status.includes('✅') ? '#c3e6cb' : 
            status.includes('❌') ? '#f5c6cb' : '#ffeaa7'
          }`
        }}>
          {status}
        </div>
      )}
    </div>
  );
}