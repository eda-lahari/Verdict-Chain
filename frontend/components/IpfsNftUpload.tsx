import React, { useState, useEffect } from 'react';
import { Upload, Hash, Link, CheckCircle, AlertCircle, FileText, Image, Video, File, Copy, Check, Calendar, Trash2, Wallet, Shield } from 'lucide-react';

// Aptos SDK types and functions (mock implementation)
interface AptosAccount {
  address: string;
  publicKey: string;
}

interface TransactionResponse {
  hash: string;
  success: boolean;
  version?: string;
  gas_used?: string;
}

// Mock Aptos SDK - Replace with actual Aptos SDK imports
const AptosSDK = {
  connect: async (): Promise<AptosAccount> => {
    // Simulate wallet connection
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          address: "0x" + Math.random().toString(16).substr(2, 40),
          publicKey: "0x" + Math.random().toString(16).substr(2, 64)
        });
      }, 1000);
    });
  },
  
  registerEvidence: async (
    account: AptosAccount,
    caseId: string,
    evidenceHash: string,
    metadata: string,
    fileSize: number,
    fileType: string
  ): Promise<TransactionResponse> => {
    // Simulate blockchain transaction
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve({
            hash: "0x" + Math.random().toString(16).substr(2, 64),
            success: true,
            version: Math.floor(Math.random() * 1000000).toString(),
            gas_used: Math.floor(Math.random() * 1000).toString()
          });
        } else {
          reject(new Error("Transaction failed: Insufficient gas or network error"));
        }
      }, 2000);
    });
  },

  getEvidence: async (address: string): Promise<any> => {
    // Simulate getting evidence from blockchain
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          evidence_hash: "sample_hash",
          case_id: "CASE-12345678",
          upload_timestamp: Date.now(),
          metadata: "Sample metadata",
          file_size: 1024,
          file_type: "image/jpeg"
        });
      }, 1000);
    });
  }
};

// Types
interface FileMetadata {
  id: string;
  caseId: string;
  name: string;
  size: number;
  type: string;
  hash: string;
  ipfsHash?: string;
  uploadDate: string;
  url?: string;
  pinataUrl?: string;
  gatewayUrl?: string;
  blockchainTxHash?: string;
  blockchainVersion?: string;
  gasUsed?: string;
  onChain: boolean;
}

interface UploadResult {
  success: boolean;
  ipfsHash?: string;
  fileName: string;
  fileSize: number;
  sha256Hash: string;
  pinataUrl?: string;
  gatewayUrl?: string;
  caseId: string;
  blockchainTxHash?: string;
  blockchainVersion?: string;
  gasUsed?: string;
}

// SHA-256 hash function
const sha256 = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    console.error('Error computing SHA-256 hash:', error);
    throw new Error('Failed to compute file hash. File may be corrupted or unsupported.');
  }
};

// Pinata SDK
const pinataUpload = async (file: File, jwt: string): Promise<{ IpfsHash: string }> => {
  if (!jwt || jwt === 'your-pinata-jwt-token-here' || !jwt.includes('.')) {
    throw new Error('Invalid or missing Pinata JWT token. Please configure your token.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const metadata = JSON.stringify({
    name: `Upload-${Date.now()}-${file.name}`,
    keyvalues: {
      uploadedBy: 'VerdictChain-System',
      timestamp: new Date().toISOString()
    }
  });
  formData.append('pinataMetadata', metadata);

  const options = JSON.stringify({
    cidVersion: 0,
  });
  formData.append('pinataOptions', options);

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Upload failed';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.details || errorJson.message || 'Upload failed';
      } catch {
        if (response.status === 401) {
          errorMessage = 'Invalid Pinata API token. Please check your JWT token.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Please check your Pinata API permissions.';
        } else if (response.status >= 500) {
          errorMessage = 'Pinata server error. Please try again later.';
        } else {
          errorMessage = `Upload failed with status ${response.status}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (!result.IpfsHash) {
      throw new Error('Invalid response from Pinata: missing IPFS hash');
    }

    return result;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Pinata. Please check your internet connection.');
    }
    throw error;
  }
};

// Generate unique case ID
const generateCaseId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CASE-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const VerdictChain: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'blockchain'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);
  
  // Blockchain states
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [aptosAccount, setAptosAccount] = useState<AptosAccount | null>(null);
  const [connectingWallet, setConnectingWallet] = useState<boolean>(false);
  
  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  // UI states
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedFileDetails, setSelectedFileDetails] = useState<FileMetadata | null>(null);

  // Environment variables
  const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3ZjRiYjJkMC0xZDY0LTQ1OTgtYjYzMC1hZDJiYzdlMjM5ZGQiLCJlbWFpbCI6IjIyNTAxYTA1MTVAcHZwc2l0LmFjLmluIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjgyMzMwYjA5MGNjNzNhMDZkYjEwIiwic2NvcGVkS2V5U2VjcmV0IjoiNTg5ZjhlMTllYTE0OGVmNDcyOWI3YzU1OTdjZjUxOGQ2M2RhNDQ3MTI1Y2U1OWNlNTc2YzNlY2IzNzdmYTExYyIsImV4cCI6MTc4NjY1ODk0MX0.8W6IfvrKeYWIFA5eyUtJpjg4qBVr83NPKB_f1Vm_yPE';
  const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

  // Load saved data
  useEffect(() => {
    const savedFiles = JSON.parse(localStorage.getItem('uploaded-files') || '[]');
    setUploadedFiles(savedFiles);
    
    // Check if wallet was previously connected
    const savedWallet = localStorage.getItem('aptos-wallet');
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet);
        setAptosAccount(walletData);
        setWalletConnected(true);
      } catch (e) {
        localStorage.removeItem('aptos-wallet');
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      localStorage.setItem('uploaded-files', JSON.stringify(uploadedFiles));
    }
  }, [uploadedFiles]);

  useEffect(() => {
    if (aptosAccount) {
      localStorage.setItem('aptos-wallet', JSON.stringify(aptosAccount));
    }
  }, [aptosAccount]);

  // Wallet connection
  const connectWallet = async () => {
    setConnectingWallet(true);
    setError(null);
    
    try {
      const account = await AptosSDK.connect();
      setAptosAccount(account);
      setWalletConnected(true);
    } catch (err: any) {
      setError(`Failed to connect wallet: ${err.message}`);
    } finally {
      setConnectingWallet(false);
    }
  };

  const disconnectWallet = () => {
    setAptosAccount(null);
    setWalletConnected(false);
    localStorage.removeItem('aptos-wallet');
  };

  // File type icons
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-8 h-8 text-white" />;
    if (mimeType.startsWith('video/')) return <Video className="w-8 h-8 text-white" />;
    if (mimeType === 'application/pdf') return <FileText className="w-8 h-8 text-white" />;
    return <File className="w-8 h-8 text-white" />;
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // File selection handlers
  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'application/pdf', 'text/plain', 'text/csv',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip', 'application/x-zip-compressed',
      'application/json', 'application/xml', 'text/xml'
    ];

    const isAllowedType = allowedTypes.includes(file.type) || 
                         file.name.toLowerCase().endsWith('.doc') ||
                         file.name.toLowerCase().endsWith('.docx') ||
                         file.name.toLowerCase().endsWith('.xls') ||
                         file.name.toLowerCase().endsWith('.xlsx') ||
                         file.name.toLowerCase().endsWith('.ppt') ||
                         file.name.toLowerCase().endsWith('.pptx') ||
                         file.name.toLowerCase().endsWith('.txt') ||
                         file.name.toLowerCase().endsWith('.csv');

    if (!isAllowedType) {
      setError('File type not supported. Please select a supported file type.');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File size too large. Maximum size is 100MB.');
      return;
    }

    if (file.size === 0) {
      setError('File appears to be empty or corrupted.');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Upload handler with blockchain integration
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    if (!walletConnected || !aptosAccount) {
      setError('Please connect your Aptos wallet first.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Step 1: Validate file
      if (selectedFile.size === 0) {
        throw new Error('File is empty or corrupted.');
      }

      // Step 2: Compute SHA-256 hash
      console.log('Computing SHA-256 hash for file:', selectedFile.name);
      const hash = await sha256(selectedFile);

      // Step 3: Check for duplicates
      const duplicate = uploadedFiles.find(f => f.hash === hash);
      if (duplicate) {
        setError(`File already uploaded. Duplicate detected (Case ID: ${duplicate.caseId}).`);
        setUploading(false);
        return;
      }

      // Step 4: Generate unique case ID
      const caseId = generateCaseId();

      // Step 5: Upload to Pinata IPFS
      console.log('Uploading to Pinata IPFS...');
      let pinataResult;
      try {
        pinataResult = await pinataUpload(selectedFile, PINATA_JWT);
      } catch (uploadError: any) {
        console.error('Pinata upload error:', uploadError);
        throw new Error(`Upload to IPFS failed: ${uploadError.message || 'Network error'}`);
      }

      // Step 6: Register evidence on Aptos blockchain
      console.log('Registering evidence on Aptos blockchain...');
      let blockchainResult;
      try {
        const metadata = JSON.stringify({
          originalName: selectedFile.name,
          ipfsHash: pinataResult.IpfsHash,
          uploadTimestamp: new Date().toISOString()
        });

        blockchainResult = await AptosSDK.registerEvidence(
          aptosAccount,
          caseId,
          hash,
          metadata,
          selectedFile.size,
          selectedFile.type || 'application/octet-stream'
        );

        if (!blockchainResult.success) {
          throw new Error('Blockchain transaction failed');
        }
      } catch (blockchainError: any) {
        console.error('Blockchain registration error:', blockchainError);
        throw new Error(`Blockchain registration failed: ${blockchainError.message || 'Transaction error'}`);
      }

      // Step 7: Create file metadata with blockchain info
      const fileMetadata: FileMetadata = {
        id: Date.now() + Math.random().toString(),
        caseId: caseId,
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type || 'application/octet-stream',
        hash: hash,
        ipfsHash: pinataResult.IpfsHash,
        uploadDate: new Date().toISOString(),
        url: URL.createObjectURL(selectedFile),
        pinataUrl: `${PINATA_GATEWAY}/${pinataResult.IpfsHash}`,
        gatewayUrl: `https://ipfs.io/ipfs/${pinataResult.IpfsHash}`,
        blockchainTxHash: blockchainResult.hash,
        blockchainVersion: blockchainResult.version,
        gasUsed: blockchainResult.gas_used,
        onChain: true
      };

      // Step 8: Save file record
      setUploadedFiles(prev => [...prev, fileMetadata]);

      // Step 9: Set upload result
      const result: UploadResult = {
        success: true,
        ipfsHash: pinataResult.IpfsHash,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        sha256Hash: hash,
        pinataUrl: `${PINATA_GATEWAY}/${pinataResult.IpfsHash}`,
        gatewayUrl: `https://ipfs.io/ipfs/${pinataResult.IpfsHash}`,
        caseId: caseId,
        blockchainTxHash: blockchainResult.hash,
        blockchainVersion: blockchainResult.version,
        gasUsed: blockchainResult.gas_used
      };

      setUploadResult(result);
      setSelectedFile(null);

    } catch (err: any) {
      console.error('Upload error:', err);
      
      let errorMessage = 'Upload failed. Please try again.';
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Delete file
  const deleteFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    if (selectedFileDetails && selectedFileDetails.id === fileId) {
      setSelectedFileDetails(null);
    }
  };

  return (
    <div style={{ margin: 0, padding: 0 }} className="min-h-screen bg-black text-white">
      <div className="w-full">
        <div className="bg-black border-b border-gray-800">
          {/* Header */}
          <div className="text-center py-8">
            <h1 className="text-4xl font-bold text-white mb-2">VERDICT-CHAIN</h1>
            <p className="text-gray-300 text-lg">Evidence Protector • Blockchain Secured • Immutable Records</p>
            
            {/* Wallet Status */}
            <div className="mt-4 flex justify-center">
              {walletConnected ? (
                <div className="flex items-center space-x-4 bg-green-900 px-6 py-3 rounded-lg border border-green-700">
                  <Shield className="w-5 h-5 text-green-400" />
                  <div className="text-left">
                    <p className="text-green-400 font-medium">Connected to Aptos</p>
                    <p className="text-green-300 text-sm">{aptosAccount?.address.slice(0, 10)}...{aptosAccount?.address.slice(-6)}</p>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="text-green-400 hover:text-green-300 text-sm underline"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={connectingWallet}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wallet className="w-5 h-5" />
                  <span>{connectingWallet ? 'Connecting...' : 'Connect Aptos Wallet'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-800">
            <nav className="flex justify-center space-x-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-4 px-6 border-b-2 font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload Evidence
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-4 px-6 border-b-2 font-medium transition-colors ${
                  activeTab === 'manage'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Cases ({uploadedFiles.length})
              </button>
              <button
                onClick={() => setActiveTab('blockchain')}
                className={`py-4 px-6 border-b-2 font-medium transition-colors ${
                  activeTab === 'blockchain'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Blockchain Status
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* Upload Files Tab */}
          {activeTab === 'upload' && (
            <div className="max-w-2xl mx-auto">
              {/* Wallet Connection Check */}
              {!walletConnected && (
                <div className="mb-6 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
                  <div className="flex items-center space-x-2 text-yellow-300">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Wallet Required</span>
                  </div>
                  <p className="text-yellow-200 mt-1">Please connect your Aptos wallet to upload evidence to the blockchain.</p>
                </div>
              )}

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-16 text-center transition-colors ${
                  dragActive 
                    ? 'border-white bg-gray-900' 
                    : 'border-gray-600 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,video/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.json,.xml,.zip"
                  className="hidden"
                  id="fileInput"
                />
                
                {uploading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-300">Securing evidence on blockchain...</p>
                    <p className="text-gray-400 text-sm mt-2">This may take a few minutes</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-16 h-16 mx-auto text-gray-400 mb-6" />
                    <p className="text-xl text-white mb-4">Drop Evidence Here</p>
                    <label
                      htmlFor="fileInput"
                      className="bg-white text-black px-8 py-3 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors font-medium"
                    >
                      Select Files
                    </label>
                  </>
                )}
              </div>

              {/* Selected File Preview */}
              {selectedFile && (
                <div className="mt-8 p-6 border border-gray-600 rounded-lg bg-gray-900">
                  <div className="flex items-center space-x-4">
                    {getFileIcon(selectedFile.type)}
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-lg">{selectedFile.name}</h3>
                      <p className="text-gray-300">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type}
                      </p>
                    </div>
                    <button
                      onClick={handleUpload}
                      disabled={uploading || !walletConnected}
                      className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {uploading ? 'Securing...' : 'Secure Evidence'}
                    </button>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-6 p-4 bg-red-900 border border-red-700 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-300">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-red-200 mt-1">{error}</p>
                </div>
              )}

              {/* Upload Result */}
              {uploadResult && (
                <div className="mt-8 bg-gray-900 border border-gray-600 rounded-lg p-8">
                  <div className="flex items-center space-x-2 text-green-400 mb-6">
                    <CheckCircle className="w-6 h-6" />
                    <h3 className="text-xl font-semibold">Evidence Secured Successfully!</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Case ID */}
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <FileText className="w-5 h-5 text-green-400" />
                        <span className="font-medium text-white text-lg">Case ID:</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-black p-4 rounded border border-gray-600">
                        <code className="text-lg font-bold text-green-400 flex-1">{uploadResult.caseId}</code>
                        <button
                          onClick={() => copyToClipboard(uploadResult.caseId, 'caseId')}
                          className="text-green-400 hover:text-green-300 p-2"
                        >
                          {copied === 'caseId' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Blockchain Transaction */}
                    {uploadResult.blockchainTxHash && (
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <Shield className="w-5 h-5 text-purple-400" />
                          <span className="font-medium text-white">Blockchain Transaction:</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-black p-4 rounded border border-gray-600">
                          <code className="text-sm break-all flex-1 text-gray-300">{uploadResult.blockchainTxHash}</code>
                          <button
                            onClick={() => copyToClipboard(uploadResult.blockchainTxHash!, 'txHash')}
                            className="text-purple-400 hover:text-purple-300 p-2"
                          >
                            {copied === 'txHash' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </div>
                        <div className="mt-2 text-sm text-gray-400">
                          Version: {uploadResult.blockchainVersion} • Gas Used: {uploadResult.gasUsed}
                        </div>
                      </div>
                    )}

                    {/* SHA-256 Hash */}
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Hash className="w-5 h-5 text-blue-400" />
                        <span className="font-medium text-white">SHA-256 Hash:</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-black p-4 rounded border border-gray-600">
                        <code className="text-sm break-all flex-1 text-gray-300">{uploadResult.sha256Hash}</code>
                        <button
                          onClick={() => copyToClipboard(uploadResult.sha256Hash, 'hash')}
                          className="text-blue-400 hover:text-blue-300 p-2"
                        >
                          {copied === 'hash' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* IPFS Hash */}
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Link className="w-5 h-5 text-purple-400" />
                        <span className="font-medium text-white">IPFS Hash:</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-black p-4 rounded border border-gray-600">
                        <code className="text-sm break-all flex-1 text-gray-300">{uploadResult.ipfsHash}</code>
                        <button
                          onClick={() => copyToClipboard(uploadResult.ipfsHash!, 'ipfs')}
                          className="text-purple-400 hover:text-purple-300 p-2"
                        >
                          {copied === 'ipfs' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manage Files Tab */}
          {activeTab === 'manage' && (
            <div>
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-20">
                  <FileText className="w-20 h-20 mx-auto text-gray-600 mb-6" />
                  <p className="text-gray-400 text-xl">No cases found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* File List */}
                  <div className="space-y-4">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`border rounded-lg p-6 cursor-pointer transition-colors hover:bg-gray-900 ${
                          selectedFileDetails?.id === file.id ? 'border-white bg-gray-900' : 'border-gray-600'
                        }`}
                        onClick={() => setSelectedFileDetails(file)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-white text-lg">{file.caseId}</h3>
                            {file.onChain && (
                              <div className="flex items-center space-x-1 bg-green-900 px-2 py-1 rounded-full">
                                <Shield className="w-3 h-3 text-green-400" />
                                <span className="text-green-400 text-xs font-medium">On-Chain</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFile(file.id);
                            }}
                            className="text-red-400 hover:text-red-300 p-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="text-gray-300 space-y-2">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(file.uploadDate).toLocaleString()}
                          </div>
                          <div className="flex items-center">
                            <Hash className="w-4 h-4 mr-2" />
                            <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                              {file.hash.substring(0, 16)}...
                            </code>
                          </div>
                          <p className="text-gray-400">{file.name} • {formatFileSize(file.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* File Details */}
                  <div className="bg-gray-900 rounded-lg p-8 border border-gray-600">
                    {selectedFileDetails ? (
                      <div>
                        <h3 className="text-xl font-semibold mb-6 text-white">Case Details</h3>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-medium text-gray-400">Case ID:</label>
                            <p className="text-white font-semibold text-2xl mt-1">{selectedFileDetails.caseId}</p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-400">Original Name:</label>
                            <p className="text-white mt-1">{selectedFileDetails.name}</p>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-400">File Size:</label>
                            <p className="text-white mt-1">{formatFileSize(selectedFileDetails.size)}</p>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-400">Type:</label>
                            <p className="text-white mt-1">{selectedFileDetails.type}</p>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-400">Upload Date:</label>
                            <p className="text-white mt-1">{new Date(selectedFileDetails.uploadDate).toLocaleString()}</p>
                          </div>

                          {/* Blockchain Info */}
                          {selectedFileDetails.onChain && (
                            <div>
                              <label className="text-sm font-medium text-gray-400">Blockchain Status:</label>
                              <div className="flex items-center space-x-2 mt-2">
                                <Shield className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-medium">Secured on Aptos Blockchain</span>
                              </div>
                              {selectedFileDetails.blockchainTxHash && (
                                <div className="mt-2">
                                  <div className="flex items-center space-x-2">
                                    <code className="text-xs bg-black p-2 rounded flex-1 break-all text-gray-300 border border-gray-600">
                                      {selectedFileDetails.blockchainTxHash}
                                    </code>
                                    <button
                                      onClick={() => copyToClipboard(selectedFileDetails.blockchainTxHash!, 'detailTxHash')}
                                      className="text-purple-400 hover:text-purple-300 p-2"
                                    >
                                      {copied === 'detailTxHash' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Version: {selectedFileDetails.blockchainVersion} • Gas: {selectedFileDetails.gasUsed}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div>
                            <label className="text-sm font-medium text-gray-400">SHA-256 Hash:</label>
                            <div className="flex items-center space-x-2 mt-2">
                              <code className="text-xs bg-black p-3 rounded flex-1 break-all text-gray-300 border border-gray-600">
                                {selectedFileDetails.hash}
                              </code>
                              <button
                                onClick={() => copyToClipboard(selectedFileDetails.hash, 'detailHash')}
                                className="text-blue-400 hover:text-blue-300 p-2"
                              >
                                {copied === 'detailHash' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          
                          {selectedFileDetails.ipfsHash && (
                            <div>
                              <label className="text-sm font-medium text-gray-400">IPFS Hash:</label>
                              <div className="flex items-center space-x-2 mt-2">
                                <code className="text-xs bg-black p-3 rounded flex-1 break-all text-gray-300 border border-gray-600">
                                  {selectedFileDetails.ipfsHash}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(selectedFileDetails.ipfsHash!, 'detailIpfs')}
                                  className="text-purple-400 hover:text-purple-300 p-2"
                                >
                                  {copied === 'detailIpfs' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedFileDetails.pinataUrl && (
                            <div className="space-y-3 pt-4">
                              <a
                                href={selectedFileDetails.pinataUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-400 hover:text-blue-300 underline"
                              >
                                🔗 View on Pinata Gateway
                              </a>
                              <a
                                href={selectedFileDetails.gatewayUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-400 hover:text-blue-300 underline"
                              >
                                🌐 View on IPFS Gateway
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400">Select a case to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Blockchain Status Tab */}
          {activeTab === 'blockchain' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-8 text-white">Blockchain Status</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Wallet Status */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-600">
                  <div className="flex items-center space-x-3 mb-4">
                    <Wallet className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Wallet Status</h3>
                  </div>
                  {walletConnected ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Connected</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        {aptosAccount?.address}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">Not Connected</span>
                    </div>
                  )}
                </div>

                {/* Total Cases */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-600">
                  <div className="flex items-center space-x-3 mb-4">
                    <FileText className="w-6 h-6 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Total Cases</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-400">{uploadedFiles.length}</p>
                  <p className="text-gray-400 text-sm">Evidence files secured</p>
                </div>

                {/* On-Chain Cases */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-600">
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="w-6 h-6 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">On-Chain</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-400">
                    {uploadedFiles.filter(f => f.onChain).length}
                  </p>
                  <p className="text-gray-400 text-sm">Blockchain secured</p>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-600">
                <h3 className="text-lg font-semibold mb-4 text-white">Recent Blockchain Transactions</h3>
                {uploadedFiles.filter(f => f.onChain && f.blockchainTxHash).length === 0 ? (
                  <p className="text-gray-400">No blockchain transactions yet</p>
                ) : (
                  <div className="space-y-4">
                    {uploadedFiles
                      .filter(f => f.onChain && f.blockchainTxHash)
                      .slice(0, 5)
                      .map(file => (
                        <div key={file.id} className="flex items-center justify-between p-4 bg-black rounded border border-gray-700">
                          <div>
                            <p className="text-white font-medium">{file.caseId}</p>
                            <p className="text-gray-400 text-sm">{new Date(file.uploadDate).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <code className="text-xs text-gray-300">{file.blockchainTxHash?.slice(0, 16)}...</code>
                            <p className="text-gray-400 text-xs">Gas: {file.gasUsed}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerdictChain;