import { useState } from "react";

interface Evidence {
  id: number;
  fileName: string;
  cid: string;
  hash: string;
  timestamp: number;
}

export default function EvidenceList() {
  const [evidences] = useState<Evidence[]>([
    {
      id: 1,
      fileName: "case_photo.jpg",
      cid: "bafkreigh2akiscaildc...",
      hash: "a7f5f35426b927411fc9231b56382173b...",
      timestamp: Date.now()
    }
  ]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("CID copied!");
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">📂 Stored Evidence</h2>
      {evidences.length === 0 ? (
        <p>No evidence uploaded yet.</p>
      ) : (
        evidences.map(ev => (
          <div key={ev.id} className="bg-white p-5 rounded-lg shadow hover:shadow-lg transition">
            <p><strong>File:</strong> {ev.fileName}</p>
            <p>
              <strong>CID:</strong> 
              <a href={`https://ipfs.io/ipfs/${ev.cid}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline ml-1">
                {ev.cid.slice(0,8)}...{ev.cid.slice(-6)}
              </a>
              <button onClick={() => copyToClipboard(ev.cid)} className="ml-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition">Copy</button>
            </p>
            <p><strong>SHA256:</strong> {ev.hash.slice(0,8)}...{ev.hash.slice(-8)}</p>
            <p><strong>Uploaded:</strong> {new Date(ev.timestamp).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  );
}
