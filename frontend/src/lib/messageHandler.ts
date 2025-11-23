import { decryptMessage, hashMessage, verifySignature } from '@/lib/crypto';
import { getPrivateKey } from '@/services/authService';

export interface IncomingMessagePayload {
  sender_username: string;
  encrypted_message: string;
  message_hash: string;
  signature: { r: string; s: string };
  timestamp: string;
}

export interface ProcessedMessage {
  id: string;
  sender: string;
  text: string;
  isVerified: boolean;
  timestamp: string;
  status: 'verified' | 'unverified' | 'corrupted';
  // For technical details modal
  hash?: string;
  signature?: { r: string; s: string };
  encryptedMessage?: string;
  // Optional error information when processing fails
  error?: string;
}

export const processIncomingMessage = async (
  payload: IncomingMessagePayload,
  senderPublicKey: string,
  myUsername: string
): Promise<ProcessedMessage> => {
  const myPrivateKey = getPrivateKey(myUsername);
  if (!myPrivateKey) throw new Error("Private key not found");

  let decryptedText = "";
  let isIntegrityValid = false;
  let isSignatureValid = false;
  let computedHash = "";

  try {
    // 1. Dekripsi Pesan
    // Menggunakan Private Key Saya + Public Key Pengirim
    decryptedText = await decryptMessage(
      myPrivateKey, 
      senderPublicKey, 
      payload.encrypted_message
    );

    // 2. Hash Ulang Plainteks (Integrity Check)
    // Kita hash hasil dekripsi kita sendiri
    // Format hash harus sama persis dengan saat pengiriman (lihat handleSendMessage sebelumnya)
    // Asumsi: yang di-hash adalah raw JSON string dari {sender, receiver, msg, ts}
    // ATAU sesuai spek simpel: hash isi pesan saja. Mari kita ikuti yang paling robust/sesuai kesepakatan backend.
    // Di sini saya asumsikan yang di-hash adalah string raw payload pesan + timestamp (simplifikasi)
    // PENTING: Sesuaikan logika ini dengan tim Backend/Sender Anda!
    const rawContentToHash = JSON.stringify({
        sender: payload.sender_username,
        // receiver: myUsername, // sesuaikan jika ada di payload hash
        msg: decryptedText,
        ts: payload.timestamp
    });
    
    // Atau jika tim Anda sepakat hanya hash isi pesan mentah:
    // const computedHash = hashMessage(decryptedText); 
    
    computedHash = hashMessage(rawContentToHash);

    // Bandingkan Hash hitungan sendiri vs Hash yang dikirim
    if (computedHash === payload.message_hash) {
      isIntegrityValid = true;
    }

    // 3. Verifikasi Signature (Authenticity Check)
    // Gunakan Public Key Pengirim + Hash
    isSignatureValid = verifySignature(
      senderPublicKey,
      computedHash, // Selalu verifikasi terhadap hash yang KITA hitung sendiri, bukan yang dikirim
      payload.signature
    );

  } catch (error) {
    console.error("Gagal memproses pesan:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      id: crypto.randomUUID(),
      sender: payload.sender_username,
      text: `[Error] Failed to decrypt / process message: ${errMsg}`,
      timestamp: payload.timestamp,
      isVerified: false,
      status: 'corrupted',
      error: errMsg
    };
  }

  // Tentukan Status Akhir
  let finalStatus: 'verified' | 'unverified' = 'unverified';
  if (isIntegrityValid && isSignatureValid) {
    finalStatus = 'verified';
  }

  return {
    id: crypto.randomUUID(),
    sender: payload.sender_username,
    text: decryptedText,
    timestamp: payload.timestamp,
    isVerified: finalStatus === 'verified',
    status: finalStatus,
    // Include technical details for modal
    hash: computedHash,
    signature: payload.signature,
    encryptedMessage: payload.encrypted_message
  };
};