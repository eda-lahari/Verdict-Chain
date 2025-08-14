// // hooks/useTamperCheck.ts
// import { useEffect } from "react";
// import { getHash } from "../utils/hash";

// export const useTamperCheck = () => {
//   useEffect(() => {
//     const currentHash = getHash();

//     // Only alert if tampering detected
//     const EXPECTED_HASH = localStorage.getItem("expectedHash"); // store the original hash once
//     if (EXPECTED_HASH && currentHash !== EXPECTED_HASH) {
//       alert("⚠️ App integrity check failed! Possible tampering detected.");
//     }
//   }, []);
// };
