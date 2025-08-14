import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import UploadEvidence from "./components/UploadEvidence";
import ViewEvidence from "./components/ViewEvidence";
import { useState } from "react";
import { useTamperCheck } from "./hooks/useTamperCheck"; // import the tamper check hook

function App() {
  const [totalEvidence, setTotalEvidence] = useState<number>(0);

  // Run integrity check on app load
  useTamperCheck();

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home totalEvidence={totalEvidence} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/upload" element={<UploadEvidence setTotalEvidence={setTotalEvidence} />} />
        <Route path="/view" element={<ViewEvidence />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
