import React, { useState, useEffect } from 'react';
import { Upload, Hash, Link, CheckCircle, AlertCircle, FileText, Image, Video, File, Copy, Check, Calendar, Eye, Trash2, Download } from 'lucide-react';

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
}

// SHA-256 hash function
const sha256 = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};

// Pinata SDK mock (since we can't import it in artifacts)
const pinataUpload = async (file: File, jwt: string): Promise<{ IpfsHash: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const metadata = JSON.stringify({
    name: `Upload-${Date.now()}-${file.name}`,
    keyvalues: {
      uploadedBy: 'File-Upload-System',
      timestamp: new Date().toISOString()
    }
  });
  formData.append('pinataMetadata', metadata);

  const options = JSON.stringify({
    cidVersion: 0,
  });
  formData.append('pinataOptions', options);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.details || 'Upload failed');
  }

  return await response.json();
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

const IpfsUploadSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);
  
  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  // UI states
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedFileDetails, setSelectedFileDetails] = useState<FileMetadata | null>(null);

  // Environment variables (you should replace this with your actual JWT)
  const PINATA_JWT = 'your-pinata-jwt-token-here';
  const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

  // Load saved data
  useEffect(() => {
    const savedFiles = JSON.parse(localStorage.getItem('uploaded-files') || '[]');
    setUploadedFiles(savedFiles);
  }, []);

  // Save data
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      localStorage.setItem('uploaded-files', JSON.stringify(uploadedFiles));
    }
  }, [uploadedFiles]);

  // File type icons
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
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
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
      'application/pdf', 'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('File type not supported. Please select an image, video, PDF, or text file.');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File size too large. Maximum size is 100MB.');
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

  // Upload handler
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Step 1: Compute SHA-256 hash
      console.log('Computing SHA-256 hash...');
      const hash = await sha256(selectedFile);

      // Step 2: Check for duplicates
      const duplicate = uploadedFiles.find(f => f.hash === hash);
      if (duplicate) {
        setError('File already uploaded. Duplicate detected.');
        setUploading(false);
        return;
      }

      // Step 3: Generate unique case ID
      const caseId = generateCaseId();

      // Step 4: Upload to Pinata IPFS
      console.log('Uploading to Pinata IPFS...');
      const pinataResult = await pinataUpload(selectedFile, PINATA_JWT);

      // Step 5: Create file metadata
      const fileMetadata: FileMetadata = {
        id: Date.now() + Math.random().toString(),
        caseId: caseId,
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        hash: hash,
        ipfsHash: pinataResult.IpfsHash,
        uploadDate: new Date().toISOString(),
        url: URL.createObjectURL(selectedFile),
        pinataUrl: `${PINATA_GATEWAY}/${pinataResult.IpfsHash}`,
        gatewayUrl: `https://ipfs.io/ipfs/${pinataResult.IpfsHash}`
      };

      // Step 6: Save file record
      setUploadedFiles(prev => [...prev, fileMetadata]);

      // Step 7: Set upload result
      const result: UploadResult = {
        success: true,
        ipfsHash: pinataResult.IpfsHash,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        sha256Hash: hash,
        pinataUrl: `${PINATA_GATEWAY}/${pinataResult.IpfsHash}`,
        gatewayUrl: `https://ipfs.io/ipfs/${pinataResult.IpfsHash}`,
        caseId: caseId
      };

      setUploadResult(result);
      setSelectedFile(null);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">File Upload System</h1>
            <p className="text-purple-100">Upload files to IPFS and manage your digital assets</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'upload'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload Files
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'manage'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Manage Files ({uploadedFiles.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Upload Files Tab */}
            {activeTab === 'upload' && (
              <div className="max-w-2xl mx-auto">
                <div className="mb-8 text-center">
                  <Upload className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Files to IPFS</h2>
                  <p className="text-gray-600">Upload files to Pinata IPFS and get SHA-256 hash + IPFS hash</p>
                </div>

                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    dragActive 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,video/*,.pdf,.txt"
                    className="hidden"
                    id="fileInput"
                  />
                  
                  {uploading ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Computing hash and uploading to IPFS...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg text-gray-600 mb-2">Drag & drop files here</p>
                      <p className="text-gray-500 mb-4">or</p>
                      <label
                        htmlFor="fileInput"
                        className="bg-purple-500 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-purple-600 transition-colors"
                      >
                        Choose Files
                      </label>
                      <p className="text-sm text-gray-500 mt-4">Supports images, videos, PDFs, and text files</p>
                    </>
                  )}
                </div>

                {/* Selected File Preview */}
                {selectedFile && (
                  <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-4">
                      {getFileIcon(selectedFile.type)}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{selectedFile.name}</h3>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type}
                        </p>
                      </div>
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {uploading ? 'Uploading...' : 'Upload to IPFS'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="text-red-600 mt-1">{error}</p>
                  </div>
                )}

                {/* Upload Result */}
                {uploadResult && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center space-x-2 text-green-700 mb-4">
                      <CheckCircle className="w-6 h-6" />
                      <h3 className="text-lg font-semibold">Upload Successful!</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Case ID */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-gray-700">Case ID:</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white p-3 rounded border">
                          <code className="text-sm font-bold text-green-600 flex-1">{uploadResult.caseId}</code>
                          <button
                            onClick={() => copyToClipboard(uploadResult.caseId, 'caseId')}
                            className="text-green-500 hover:text-green-700 p-1"
                          >
                            {copied === 'caseId' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* SHA-256 Hash */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Hash className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-700">SHA-256 Hash:</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white p-3 rounded border">
                          <code className="text-sm break-all flex-1">{uploadResult.sha256Hash}</code>
                          <button
                            onClick={() => copyToClipboard(uploadResult.sha256Hash, 'hash')}
                            className="text-blue-500 hover:text-blue-700 p-1"
                          >
                            {copied === 'hash' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* IPFS Hash */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Link className="w-4 h-4 text-purple-500" />
                          <span className="font-medium text-gray-700">IPFS Hash (CID):</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white p-3 rounded border">
                          <code className="text-sm break-all flex-1">{uploadResult.ipfsHash}</code>
                          <button
                            onClick={() => copyToClipboard(uploadResult.ipfsHash!, 'ipfs')}
                            className="text-purple-500 hover:text-purple-700 p-1"
                          >
                            {copied === 'ipfs' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Links */}
                      <div className="flex space-x-4 pt-2">
                        <a
                          href={uploadResult.pinataUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          🔗 View on Pinata Gateway
                        </a>
                        <a
                          href={uploadResult.gatewayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          🌐 View on IPFS Gateway
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manage Files Tab */}
            {activeTab === 'manage' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Uploaded Files</h2>
                  <p className="text-gray-600">View and manage your digital assets</p>
                </div>

                {uploadedFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No files uploaded yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* File List */}
                    <div className="space-y-4">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedFileDetails?.id === file.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                          }`}
                          onClick={() => setSelectedFileDetails(file)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-800">{file.caseId}</h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFile(file.id);
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(file.uploadDate).toLocaleString()}
                            </div>
                            <div className="flex items-center">
                              <Hash className="w-3 h-3 mr-1" />
                              <code className="text-xs bg-gray-100 px-1 rounded">
                                {file.hash.substring(0, 16)}...
                              </code>
                            </div>
                            <p className="text-gray-500">{file.name} • {formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* File Details */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      {selectedFileDetails ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-gray-800">File Details</h3>
                          
                          <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-6">
                            {getFileIcon(selectedFileDetails.type)}
                            <span className="ml-2 text-gray-600">File Preview Not Available</span>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Case ID:</label>
                              <p className="text-gray-900 font-semibold text-lg">{selectedFileDetails.caseId}</p>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700">Original Name:</label>
                              <p className="text-gray-900">{selectedFileDetails.name}</p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700">File Size:</label>
                              <p className="text-gray-900">{formatFileSize(selectedFileDetails.size)}</p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700">Type:</label>
                              <p className="text-gray-900">{selectedFileDetails.type}</p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700">Upload Date:</label>
                              <p className="text-gray-900">{new Date(selectedFileDetails.uploadDate).toLocaleString()}</p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700">SHA-256 Hash:</label>
                              <div className="flex items-center space-x-2 mt-1">
                                <code className="text-xs bg-gray-200 p-2 rounded flex-1 break-all">
                                  {selectedFileDetails.hash}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(selectedFileDetails.hash, 'detailHash')}
                                  className="text-blue-500 hover:text-blue-700 p-1"
                                >
                                  {copied === 'detailHash' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                            
                            {selectedFileDetails.ipfsHash && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">IPFS Hash:</label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <code className="text-xs bg-gray-200 p-2 rounded flex-1 break-all">
                                    {selectedFileDetails.ipfsHash}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(selectedFileDetails.ipfsHash!, 'detailIpfs')}
                                    className="text-purple-500 hover:text-purple-700 p-1"
                                  >
                                    {copied === 'detailIpfs' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            )}

                            {selectedFileDetails.pinataUrl && (
                              <div className="space-y-2 pt-2">
                                <a
                                  href={selectedFileDetails.pinataUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                  🔗 View on Pinata Gateway
                                </a>
                                <a
                                  href={selectedFileDetails.gatewayUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                  🌐 View on IPFS Gateway
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600">Select a file to view details</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">How it works:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">1. Upload Files</h4>
              <p className="text-purple-700">Files are hashed (SHA-256) and uploaded to Pinata IPFS with unique Case ID</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">2. Get Identifiers</h4>
              <p className="text-green-700">Receive Case ID, SHA-256 hash and IPFS CID for tracking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IpfsUploadSystem;