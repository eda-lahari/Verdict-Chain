import React, { useState } from 'react';

// Type definitions
type Network = "mainnet" | "testnet" | "devnet";

interface Account {
  address: string;
}

interface Transaction {
  sender: string;
  data: {
    function: string;
    functionArguments: any[];
  };
}

interface TransactionResponse {
  hash: string;
}

// Mock constants - replace with your actual values
const MODULE_ADDRESS: string = "0x1234567890abcdef"; // Your module address
const NETWORK: Network = "testnet"; // or mainnet

// Mock wallet hook for demonstration
const useWallet = () => ({
  account: { address: "0xa6e403e9b123456789abcdef" } as Account,
  connected: true,
  signAndSubmitTransaction: async (transaction: Transaction): Promise<TransactionResponse> => {
    console.log("Mock transaction:", transaction);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { hash: `0x${Math.random().toString(16).substring(2, 66)}` };
  }
});

// Mock Aptos client with proper evidence storage simulation
const aptos = {
  waitForTransaction: async ({ transactionHash }: { transactionHash: string }) => {
    console.log("Waiting for transaction:", transactionHash);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true };
  },
  
  // Mock function to query evidence from blockchain
  getAccountResource: async (address: string, resourceType: string, caseId: string) => {
    console.log(`Querying evidence for case ID: ${caseId}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate checking if evidence exists on blockchain
    // In reality, this would query your smart contract
    // For now, we'll only return data for case IDs that were "uploaded" in this session
    const storedCases = getStoredCases();
    const evidence = storedCases.find(c => c.caseId === caseId);
    
    if (!evidence) {
      throw new Error("Evidence not found on blockchain");
    }
    
    return evidence;
  }
};

// Mock storage to simulate blockchain persistence (in real app, this would be the blockchain)
const STORAGE_KEY = 'mock_blockchain_evidence';

const getStoredCases = (): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const storeCaseOnBlockchain = (caseData: any) => {
  try {
    const existingCases = getStoredCases();
    const updatedCases = [...existingCases, caseData];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCases));
  } catch (error) {
    console.error('Error storing case data:', error);
  }
};

// Mock IPFS and hash functions - replace with your friend's actual functions
const uploadToIPFS = async (file: File): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return `QmMock${Date.now()}`;
};

const sha256 = async (file: File): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return `0x${Math.random().toString(16).substring(2, 66)}`;
};

// Generate unique case ID
const generateCaseId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `CASE_${timestamp}_${random}`.toUpperCase();
};

interface EvidenceManagementProps {
  setTotalEvidence: React.Dispatch<React.SetStateAction<number>>;
}

export default function EvidenceManagement({ setTotalEvidence }: EvidenceManagementProps) {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [activeTab, setActiveTab] = useState<'upload' | 'view'>('upload');
  
  // Upload states
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [generatedCaseId, setGeneratedCaseId] = useState<string>("");
  
  // View states
  const [searchCaseId, setSearchCaseId] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [searchStatus, setSearchStatus] = useState<string>("");

  const handleUpload = async () => {
    if (!connected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!file) {
      alert("Please select a file to upload!");
      return;
    }

    setIsUploading(true);
    const newCaseId = generateCaseId();
    setGeneratedCaseId(newCaseId);

    try {
      setUploadStatus("📤 Uploading file to IPFS...");
      const ipfsHash = await uploadToIPFS(file);
      
      setUploadStatus("🔐 Generating file hash...");
      const fileHash = await sha256(file);

      setUploadStatus("⛓️ Storing on Aptos blockchain...");
      
      const transaction = await signAndSubmitTransaction({
        sender: account!.address,
        data: {
          function: `${MODULE_ADDRESS}::EvidenceRegister::register_evidence`,
          functionArguments: [
            newCaseId,
            fileHash,
            description.trim() || `File: ${file.name}, IPFS: ${ipfsHash}`
          ],
        },
      });

      setUploadStatus("⏳ Waiting for confirmation...");
      
      await aptos.waitForTransaction({
        transactionHash: transaction.hash,
      });

      // Store the evidence data in mock blockchain
      const evidenceRecord = {
        caseId: newCaseId,
        fileHash: fileHash,
        metadata: description.trim() || `File: ${file.name}, IPFS: ${ipfsHash}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        uploader: account!.address,
        ipfsHash: ipfsHash,
        fileName: file.name,
        transactionHash: transaction.hash
      };
      
      storeCaseOnBlockchain(evidenceRecord);

      setUploadStatus(`✅ Success! Case ID: ${newCaseId}`);
      
      // Increment total evidence count
      setTotalEvidence(prev => prev + 1);
      
      // Reset form after 5 seconds
      setTimeout(() => {
        setFile(null);
        setDescription("");
        setUploadStatus("");
        setGeneratedCaseId("");
      }, 5000);

    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("❌ Upload failed. Check console for details.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!connected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!searchCaseId.trim()) {
      alert("Please enter a case ID to search!");
      return;
    }

    setIsSearching(true);
    setSearchStatus("🔍 Searching blockchain...");
    setEvidenceData(null); // Clear previous results

    try {
      // Query the blockchain for the specific case ID
      const result = await aptos.getAccountResource(
        account!.address, 
        `${MODULE_ADDRESS}::EvidenceRegister::Evidence`,
        searchCaseId.trim()
      );
      
      setEvidenceData(result);
      setSearchStatus("✅ Evidence found!");

    } catch (error) {
      console.error("Search error:", error);
      setSearchStatus("❌ Evidence not found on blockchain.");
      setEvidenceData(null);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchCaseId("");
    setEvidenceData(null);
    setSearchStatus("");
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '20px auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      {/* Wallet Status */}
      <div style={{ 
        padding: '15px', 
        borderRadius: '10px',
        marginBottom: '20px',
        textAlign: 'center',
        backgroundColor: connected ? '#d4edda' : '#fff3cd',
        border: `2px solid ${connected ? '#c3e6cb' : '#ffeaa7'}`
      }}>
        {connected ? (
          <span style={{ color: '#155724', fontWeight: 'bold' }}>
            ✅ Wallet Connected: {account?.address.toString().slice(0, 8)}...
          </span>
        ) : (
          <span style={{ color: '#856404', fontWeight: 'bold' }}>
            ⚠️ Please connect your Aptos wallet to continue
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '30px',
        borderBottom: '2px solid #eee'
      }}>
        <button 
          onClick={() => setActiveTab('upload')}
          style={{
            flex: 1,
            padding: '15px',
            border: 'none',
            backgroundColor: activeTab === 'upload' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'upload' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '10px 10px 0 0'
          }}
        >
          📤 Upload New Evidence
        </button>
        <button 
          onClick={() => setActiveTab('view')}
          style={{
            flex: 1,
            padding: '15px',
            border: 'none',
            backgroundColor: activeTab === 'view' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'view' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '10px 10px 0 0'
          }}
        >
          🔍 View Existing Evidence
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div style={{ 
          padding: '30px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '15px',
          border: '1px solid #dee2e6'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
            Upload New Evidence
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              Select Evidence File *
            </label>
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              Description (Optional)
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the evidence..."
              rows={3}
              style={{ 
                width: '100%', 
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                resize: 'vertical',
                fontSize: '14px'
              }}
            />
          </div>

          <button 
            onClick={handleUpload} 
            disabled={!connected || isUploading || !file}
            style={{ 
              width: '100%',
              padding: '15px',
              backgroundColor: connected && !isUploading && file ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: connected && !isUploading && file ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {isUploading ? '🔄 Uploading...' : '📤 Upload to Blockchain'}
          </button>

          {uploadStatus && (
            <div style={{ 
              marginTop: '20px', 
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center',
              fontWeight: 'bold',
              backgroundColor: uploadStatus.includes('✅') ? '#d4edda' : 
                             uploadStatus.includes('❌') ? '#f8d7da' : '#fff3cd',
              border: `2px solid ${
                uploadStatus.includes('✅') ? '#c3e6cb' : 
                uploadStatus.includes('❌') ? '#f5c6cb' : '#ffeaa7'
              }`
            }}>
              {uploadStatus}
              {generatedCaseId && uploadStatus.includes('✅') && (
                <div style={{ marginTop: '10px', fontSize: '14px' }}>
                  <strong>Save this Case ID: {generatedCaseId}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* View Tab */}
      {activeTab === 'view' && (
        <div style={{ 
          padding: '30px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '15px',
          border: '1px solid #dee2e6'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
            View Existing Evidence
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              Enter Case ID *
            </label>
            <input 
              type="text" 
              value={searchCaseId}
              onChange={(e) => setSearchCaseId(e.target.value)}
              placeholder="CASE_1234567890_ABC123"
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button 
              onClick={handleSearch} 
              disabled={!connected || isSearching || !searchCaseId.trim()}
              style={{ 
                flex: 1,
                padding: '15px',
                backgroundColor: connected && !isSearching && searchCaseId.trim() ? '#17a2b8' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: connected && !isSearching && searchCaseId.trim() ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {isSearching ? '🔄 Searching...' : '🔍 Search Evidence'}
            </button>
            
            <button 
              onClick={clearSearch}
              style={{ 
                padding: '15px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Clear
            </button>
          </div>

          {searchStatus && (
            <div style={{ 
              marginTop: '20px', 
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center',
              fontWeight: 'bold',
              backgroundColor: searchStatus.includes('✅') ? '#d4edda' : '#f8d7da',
              border: `2px solid ${searchStatus.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {searchStatus}
            </div>
          )}

          {evidenceData && (
            <div style={{ 
              marginTop: '20px', 
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '10px',
              border: '2px solid #c3e6cb'
            }}>
              <h3 style={{ color: '#155724', marginBottom: '15px' }}>Evidence Details:</h3>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <p><strong>Case ID:</strong> {evidenceData.caseId}</p>
                <p><strong>File Name:</strong> {evidenceData.fileName}</p>
                <p><strong>File Hash:</strong> {evidenceData.fileHash}</p>
                <p><strong>IPFS Hash:</strong> {evidenceData.ipfsHash}</p>
                <p><strong>Description:</strong> {evidenceData.metadata}</p>
                <p><strong>Upload Time:</strong> {evidenceData.timestamp}</p>
                <p><strong>Uploaded by:</strong> {evidenceData.uploader?.slice(0, 8)}...</p>
                <p><strong>Transaction Hash:</strong> {evidenceData.transactionHash?.slice(0, 12)}...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}