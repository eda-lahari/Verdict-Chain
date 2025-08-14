// utils/hash.ts

export function getHash(): string {
  // Example: compute hash of some critical data
  const data = localStorage.getItem("evidenceData") || "";
  // Replace with your actual hashing logic
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0; // convert to 32bit integer
  }
  return hash.toString();
}
