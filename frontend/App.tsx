import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import IpfsNftUpload from "./components/IpfsNftUpload";

function App() {
  const [totalEvidence] = useState(0);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home totalEvidence={totalEvidence} />} />
        <Route path="/upload" element={<IpfsNftUpload />} />
        <Route path="/evidence" element={<div>Evidence Page Coming Soon</div>} />
      </Routes>
    </Router>
  );
}

export default App;