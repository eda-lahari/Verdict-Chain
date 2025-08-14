#  Verdict-Chain – Tamper-Proof Evidence Management on Aptos

**Verdict-Chain** is a blockchain-powered platform to securely upload, verify, and track court evidence. Files are stored on **IPFS**, metadata and integrity proofs are anchored on the **Aptos** blockchain, and the **MERN** stack powers the app experience. The system delivers immutable audit trails, privacy-preserving verification, and real-time tamper alerts.

---

##  Highlights

- **Immutable Registry (Aptos):** Evidence ID, SHA-256 hash, timestamps, roles, and custody events recorded as on-chain objects.
- **Decentralized Storage (IPFS/Pinata):** Content-addressed files with gateway links and pinned availability.
- **Non-Transferable NFTs:** Each evidence item mints as a bound NFT (soulbound) with full custody history.
- **Multi-Sig Chain of Custody:** Transfers require approvals from multiple authorized roles.
- **Zero-Knowledge Friendly:** Store/verify ZK proofs off-chain; commit proof hashes on-chain.
- **Real-Time Alerts:** Client subscribes to Aptos events and flags suspicious updates.
- **Built-in Tamper Check:** Frontend compares expected hash vs. current to detect local manipulation.

---

##  Vision

Create a trustless, court-grade evidence management layer where police, forensics, and courts collaborate without fearing data loss, alteration, or opaque custody. Replace vulnerable paper trails and siloed databases with verifiable, privacy-first workflows.

---

##  Key Features

1. **Evidence Upload**
   - Client computes SHA-256, uploads to IPFS via Pinata.
   - Aptos entry (CID + hash + metadata) is created atomically.

2. **Verification**
   - Any viewer recomputes local SHA-256 and checks chain metadata.
   - Optional ZK proof validation without exposing file contents.

3. **Custody**
   - Multi-role approvals stored as events; evidence NFT metadata updates.
   - Full diff-less audit trail retrievable by case ID.

4. **Tamper Detection**
   - Frontend integrity hook (`useTamperCheck`) compares expected vs. current hash.
   - Alerts + optional auto-logout on mismatch.

5. **Role-Aware Access**
   - Basic JWT session + UI gating for Investigator / Forensics / Judge.

---
Home Page:
![pic-1](https://github.com/user-attachments/assets/b3d13f1b-42a2-4243-81f0-65f69769a388)
Evidence Encryption:
![pic-2](https://github.com/user-attachments/assets/03d9114d-2e84-4e01-9278-d251c9707fd1)



##  Future Scope

- AI-based media authenticity scoring (deepfake detection).
- Cross-jurisdiction evidence exchanges via chain bridges.
- Secure mobile capture (body-cam ingest + offline cache + sync).
- Formal verification of Move modules for custody invariants.
- Hardware-backed key custody (HSM / passkey).

---

##  Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind, Aptos SDK
- **Blockchain:** Aptos (Move), Events, Token Objects (non-transferable)
- **Storage:** IPFS + Pinata

---

Video Link to project : 
https://drive.google.com/drive/folders/1vkh_OFVl70m5FCq24Bw1NBJnTJTH7vFD?usp=sharing
