import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import EvidenceManagement from "./components/EvidenceManagement";
import { useState } from "react";

function App() {
  const [totalEvidence, setTotalEvidence] = useState<number>(0);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home totalEvidence={totalEvidence} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/evidence" 
          element={<EvidenceManagement setTotalEvidence={setTotalEvidence} />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;