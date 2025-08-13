import React, { useState } from "react";
import "./css/Evidence.css";

interface UploadEvidenceProps {
  setTotalEvidence: React.Dispatch<React.SetStateAction<number>>;
}

export default function UploadEvidence({ setTotalEvidence }: UploadEvidenceProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (!file) return alert("Select a file first!");

    // Placeholder: Replace with NFTStorage or Aptos blockchain upload
    alert(`Uploading ${file.name}`);

    // Increment total evidence count
    setTotalEvidence(prev => prev + 1);

    // Reset file input
    setFile(null);
  };

  return (
    <div className="evidence-container">
      <h2>Upload Evidence</h2>
      <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} className="btn-primary">Upload</button>
    </div>
  );
}
