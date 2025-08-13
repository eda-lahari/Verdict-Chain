import React, { useState } from 'react';
import { uploadToIPFS } from '../utils/ipfs';
import { sha256 } from '../utils/hash';

export default function EvidenceUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [cid, setCid] = useState<string>("");
  const [hash, setHash] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please choose a file first");
      return;
    }

    try {
      setStatus("Uploading to IPFS...");
      const newCid = await uploadToIPFS(file);
      setCid(newCid);

      setStatus("Generating SHA256 hash...");
      const newHash = await sha256(file);
      setHash(newHash);

      setStatus("✅ File processed successfully!");

      // TODO: Call Aptos contract here
    } catch (err) {
      console.error(err);
      setStatus("❌ Upload failed. Check console for details.");
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f2f2f2', borderRadius: '10px', maxWidth: '500px', margin: 'auto' }}>
      <h2>Upload Court Evidence</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} style={{ marginTop: '10px' }}>Upload</button>

      {status && <p>{status}</p>}
      {file && <p>📂 Selected: {file.name}</p>}
      {cid && <p>🆔 CID: <code>{cid}</code></p>}
      {hash && <p>🔒 SHA256: <code>{hash}</code></p>}
    </div>
  );
}
