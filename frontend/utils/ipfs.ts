import { NFTStorage, File } from 'nft.storage';

function getClient(): NFTStorage {
  return new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE_KEY });
}

export async function uploadToIPFS(file: File): Promise<string> {
  const client = getClient();
  const cid = await client.storeBlob(new File([file], file.name, { type: file.type }));
  console.log('Stored on IPFS with CID:', cid);
  return cid; // Will go into Aptos contract
}