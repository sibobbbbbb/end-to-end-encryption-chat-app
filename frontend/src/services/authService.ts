import { generateKeyPairFromPassword, signMessage, hashMessage } from '@/lib/crypto';

// Gunakan proxy yang sudah diset di vite.config.ts
const API_URL = '/api/auth'; 

// Helper untuk menyimpan Private Key di Local Storage (Sesuai Spek Tahap 1)
export const saveKeys = (username: string, privateKey: string) => {
  localStorage.setItem(`priv_${username}`, privateKey);
};

export const getPrivateKey = (username: string): string | null => {
  return localStorage.getItem(`priv_${username}`);
};

// --- 1. Registrasi dengan Password ---
export const registerUser = async (username: string, password: string) => {
  // 1. Generate Kunci Deterministik dari Password (KDF)
  // Sesuai Spek: Password -> Seed -> KeyPair
  const { privateKey, publicKey } = generateKeyPairFromPassword(username, password);

  // 2. Simpan Private Key di Local Storage
  saveKeys(username, privateKey);

  // 3. Kirim HANYA Public Key & Username ke Server (Password TIDAK DIKIRIM)
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, publicKey }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Registration failed');
  }
  
  return await response.json();
};

// --- 2. Login dengan Password ---
export const loginUser = async (username: string, password: string) => {
  // 1. Regenerate Private Key dari Password inputan user
  // Sesuai Spek Tahap 2: "Web Client menurunkan kunci privat ECC dari Password"
  const { privateKey } = generateKeyPairFromPassword(username, password);
  
  // (Opsional) Update storage biar sinkron
  saveKeys(username, privateKey);

  // A. Minta Challenge (Nonce)
  const challengeRes = await fetch(`${API_URL}/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  
  if (!challengeRes.ok) {
      const err = await challengeRes.json();
      throw new Error(err.message || 'User not found / Failed to request challenge');
  }
  
  const { data: { nonce } } = await challengeRes.json();

  // B. Sign Nonce (Hash dulu nonce-nya)
  const nonceHash = hashMessage(nonce);
  const signature = signMessage(privateKey, nonceHash);

  // C. Kirim Signature untuk Verifikasi (Password TIDAK DIKIRIM)
  const verifyRes = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      signature // { r, s }
    }),
  });

  if (!verifyRes.ok) {
      const err = await verifyRes.json();
      throw new Error(err.message || 'Login failed / Incorrect password (Signature mismatch)');
  }
  
  const result = await verifyRes.json();
  return result.data; 
};