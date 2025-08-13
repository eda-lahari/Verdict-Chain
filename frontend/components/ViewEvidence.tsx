import { useState } from "react";
import "./css/Evidence.css";

interface Evidence {
  id: number;
  fileName: string;
  cid: string;
  hash: string;
  timestamp: number;
}

export default function ViewEvidence() {
  const [evidences] = useState<Evidence[]>([
    { id: 1, fileName: "case_photo.jpg", cid: "bafkreigh2...", hash: "a7f5f3...", timestamp: Date.now() },
  ]);

  return (
    <div className="evidence-container">
      <h2>View Evidence</h2>
      {evidences.map(ev => (
        <div key={ev.id} className="evidence-card">
          <p><strong>File:</strong> {ev.fileName}</p>
          <p><strong>CID:</strong> {ev.cid}</p>
          <p><strong>Hash:</strong> {ev.hash}</p>
          <p><strong>Uploaded:</strong> {new Date(ev.timestamp).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
