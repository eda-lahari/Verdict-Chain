import React from "react";
import EvidenceUploader from "./components/EvidenceUploader";
import EvidenceList from "./components/EvidenceList";

function App() {
  return (
    <div>
      <h1>Verdict-Chain</h1>
      <EvidenceUploader />
      <EvidenceList />
    </div>
  );
}

export default App;
