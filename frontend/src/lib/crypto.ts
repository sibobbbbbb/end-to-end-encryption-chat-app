import { ec as EC } from 'elliptic';
import { sha3_256 } from 'js-sha3';

const ec = new EC('secp256k1');

// --- Tipe Data ---
export interface KeyPair {
  privateKey: string; // hex
  publicKey: string;  // hex
}

export interface Signature {
  r: string;
  s: string;
}

// --- [BARU] Generate Key Pair Deterministik dari Password ---
// Sesuai Spesifikasi Tahap 1 & 2: Password jadi seed/KDF
export const generateKeyPairFromPassword = (username: string, password: string): KeyPair => {
  // Gunakan username sebagai salt agar password sama beda user hasilnya beda
  const seed = `${username}:${password}`;
  
  // Hash SHA-3 untuk mendapatkan entropy 256-bit
  const privateKeyHex = sha3_256(seed);
  
  // Generate KeyPair dari Private Key tersebut
  const key = ec.keyFromPrivate(privateKeyHex);
  
  return {
    privateKey: key.getPrivate('hex'),
    publicKey: key.getPublic('hex'),
  };
};

// --- 2. Hashing (SHA-3) ---
export const hashMessage = (message: string): string => {
  return sha3_256(message);
};

// --- 3. Signing (ECDSA) ---
export const signMessage = (privateKeyHex: string, messageHash: string): Signature => {
  const key = ec.keyFromPrivate(privateKeyHex);
  const signature = key.sign(messageHash);
  return {
    r: signature.r.toString('hex'),
    s: signature.s.toString('hex'),
  };
};

// --- 4. Verifikasi Signature ---
export const verifySignature = (publicKeyHex: string, messageHash: string, signature: Signature): boolean => {
  const key = ec.keyFromPublic(publicKeyHex, 'hex');
  return key.verify(messageHash, signature);
};

// --- 5. Enkripsi E2E (ECDH + AES-GCM) ---
const deriveSharedSecret = (privateKeyHex: string, otherPublicKeyHex: string): BufferSource => {
  const key = ec.keyFromPrivate(privateKeyHex);
  const otherKey = ec.keyFromPublic(otherPublicKeyHex, 'hex');
  const shared = key.derive(otherKey.getPublic()); 
  
  const sharedHex = shared.toString(16);
  // Padding jika panjang ganjil (penting untuk kompatibilitas)
  const paddedHex = sharedHex.length % 2 !== 0 ? '0' + sharedHex : sharedHex;
  
  // Hash shared secret agar jadi kunci AES yang valid (32 bytes)
  const keyHash = sha3_256.create().update(paddedHex).arrayBuffer();
  return keyHash;
};

export const encryptMessage = async (
  myPrivateKey: string,
  theirPublicKey: string,
  plaintext: string
): Promise<string> => {
  const secret = deriveSharedSecret(myPrivateKey, theirPublicKey);
  
  const key = await window.crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(plaintext);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encodedText
  );

  const ivArr = Array.from(iv);
  const encryptedArr = Array.from(new Uint8Array(encrypted));
  return JSON.stringify({ iv: ivArr, data: encryptedArr }); 
};

export const decryptMessage = async (
  myPrivateKey: string,
  senderPublicKey: string,
  encryptedJson: string
): Promise<string> => {
  try {
    const { iv, data } = JSON.parse(encryptedJson);
    const secret = deriveSharedSecret(myPrivateKey, senderPublicKey);

    const key = await window.crypto.subtle.importKey(
      'raw',
      secret,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Gagal dekripsi:", error);
    throw new Error("Decryption Failed");
  }
};