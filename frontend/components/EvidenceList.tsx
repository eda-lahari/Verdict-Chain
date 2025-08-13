import React, { useState } from "react";

interface Evidence {
  id: number;
  fileName: string;
  cid: string;
  hash: string;
  timestamp: number;
}

export default function EvidenceList() {
  const [evidences, setEvidences] = useState<Evidence[]>([
    // Demo data — later replace with data from Aptos contract
    {
      id: 1,
      fileName: "case_photo.jpg",
      cid: "bafkreigh2akiscaildc...",
      hash: "a7f5f35426b927411fc9231b56382173b...",
      timestamp: Date.now()
    }
  ]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📂 Stored Evidence</h2>
      {evidences.map(ev => (
        <div key={ev.id} style={{
          background: "#fff",
          padding: "15px",
          marginBottom: "10px",
          borderRadius: "8px",
          boxShadow: "0 0 5px rgba(0,0,0,0.1)"
        }}>
          <p><strong>File:</strong> {ev.fileName}</p>
          <p>
            <strong>CID:</strong> <a href={`https://ipfs.io/ipfs/${ev.cid}`} target="_blank" rel="noreferrer">
              {ev.cid}
            </a>
          </p>
          <p><strong>SHA256:</strong> {ev.hash}</p>
          <p><strong>Uploaded:</strong> {new Date(ev.timestamp).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
