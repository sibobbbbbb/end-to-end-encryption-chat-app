// Utility untuk menyimpan dan memeriksa perubahan public key
// Digunakan untuk deteksi MITM (Man-in-the-Middle) attack

export interface StoredKeyInfo {
  publicKey: string;
  fingerprint: string;
  firstSeen: string; // ISO timestamp
  lastSeen: string; // ISO timestamp
}

const STORAGE_PREFIX = 'pubkey_';

/**
 * Simpan public key untuk user tertentu
 */
export const savePublicKey = (username: string, publicKey: string, fingerprint: string): void => {
  const keyInfo: StoredKeyInfo = {
    publicKey,
    fingerprint,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  };
  
  localStorage.setItem(`${STORAGE_PREFIX}${username}`, JSON.stringify(keyInfo));
};

/**
 * Ambil public key yang tersimpan untuk user
 */
export const getStoredPublicKey = (username: string): StoredKeyInfo | null => {
  const stored = localStorage.getItem(`${STORAGE_PREFIX}${username}`);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as StoredKeyInfo;
  } catch {
    return null;
  }
};

/**
 * Periksa apakah public key berubah
 */
export const hasPublicKeyChanged = (username: string, currentPublicKey: string): boolean => {
  const stored = getStoredPublicKey(username);
  if (!stored) return false; // First time, tidak ada perubahan
  
  return stored.publicKey !== currentPublicKey;
};

/**
 * Update last seen timestamp
 */
export const updateLastSeen = (username: string): void => {
  const stored = getStoredPublicKey(username);
  if (!stored) return;
  
  stored.lastSeen = new Date().toISOString();
  localStorage.setItem(`${STORAGE_PREFIX}${username}`, JSON.stringify(stored));
};

/**
 * Trust new key (replace old key)
 */
export const trustNewKey = (username: string, newPublicKey: string, newFingerprint: string): void => {
  const stored = getStoredPublicKey(username);
  
  const keyInfo: StoredKeyInfo = {
    publicKey: newPublicKey,
    fingerprint: newFingerprint,
    firstSeen: stored?.firstSeen || new Date().toISOString(),
    lastSeen: new Date().toISOString()
  };
  
  localStorage.setItem(`${STORAGE_PREFIX}${username}`, JSON.stringify(keyInfo));
};

/**
 * Hapus stored key (untuk testing atau reset)
 */
export const clearStoredKey = (username: string): void => {
  localStorage.removeItem(`${STORAGE_PREFIX}${username}`);
};

