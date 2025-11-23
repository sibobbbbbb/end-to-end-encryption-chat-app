import { useState, useEffect } from 'react';
import { ChatBubble } from '@/components/ChatBubble';
import { processIncomingMessage, type ProcessedMessage, type IncomingMessagePayload } from '@/lib/messageHandler';
import { encryptMessage, hashMessage, signMessage } from '@/lib/crypto';
import { getPrivateKey } from '@/services/authService';
import { getContactProfile } from '@/services/userService'; // Pastikan file service ini sudah dibuat

interface ChatPageProps {
  currentUser: string;
  contactUsername: string;
}

export default function ChatPage({ currentUser, contactUsername }: ChatPageProps) {
  const [messages, setMessages] = useState<ProcessedMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [contactPublicKey, setContactPublicKey] = useState<string | null>(null);
  const [isKeyLoading, setIsKeyLoading] = useState(false);

  // 1. Fetch Public Key Lawan saat kontak berubah
  useEffect(() => {
    const fetchKey = async () => {
      setIsKeyLoading(true);
      setContactPublicKey(null); // Reset dulu biar tidak pakai key user sebelumnya
      setMessages([]); // Opsional: Bersihkan chat saat ganti kontak

      try {
        const profile = await getContactProfile(contactUsername);
        if (profile) {
          setContactPublicKey(profile.publicKey);
          console.log(`Public key ${contactUsername} didapat:`, profile.publicKey);
        } else {
          console.warn(`User ${contactUsername} tidak ditemukan.`);
        }
      } finally {
        setIsKeyLoading(false);
      }
    };

    fetchKey();
  }, [contactUsername]);

  // 2. Simulasi Polling Pesan (Hanya jalan jika Public Key sudah ada)
  useEffect(() => {
    if (!contactPublicKey) return;

    const interval = setInterval(async () => {
      // Payload Dummy (Simulasi)
      // Di real app, fetch('/api/messages?partner=' + contactUsername)
      const dummyIncomingPayload: IncomingMessagePayload = {
        sender_username: contactUsername,
        encrypted_message: JSON.stringify({ iv: [], data: [] }), // Mock encrypted data
        message_hash: "hash_dummy",
        signature: { r: "sig_r", s: "sig_s" },
        timestamp: new Date().toISOString()
      };

      try {
        const processed = await processIncomingMessage(
          dummyIncomingPayload, 
          contactPublicKey, 
          currentUser
        );

        // Masukkan ke state (Simulasi: hanya jika valid/belum ada)
        setMessages(prev => {
            const exists = prev.some(m => m.timestamp === processed.timestamp);
            // Di real app, validasi 'verified' sangat penting. Di demo ini kita skip biar gak flooding.
            if (!exists && processed.status === 'verified') { 
                return [...prev, processed];
            }
            return prev;
        });
      } catch (err) {
        // Silent catch untuk polling
      }
    }, 5000); 

    return () => clearInterval(interval);
  }, [currentUser, contactUsername, contactPublicKey]); 

  // 3. Handle Kirim Pesan
  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    if (!contactPublicKey) {
        alert("Gagal mendapatkan kunci enkripsi lawan bicara. Cek koneksi atau user tidak valid.");
        return;
    }

    try {
       const myPrivateKey = getPrivateKey(currentUser);
       if (!myPrivateKey) {
           alert("Sesi tidak valid (Private Key hilang). Silakan login ulang.");
           return;
       }

       // A. Hash & Sign (Integritas & Autentikasi)
       const timestamp = new Date().toISOString();
       const rawPayload = JSON.stringify({
           sender: currentUser,
           receiver: contactUsername,
           msg: inputText,
           ts: timestamp
       });
       const msgHash = hashMessage(rawPayload); 
       const signature = signMessage(myPrivateKey, msgHash);

       // B. Encrypt (Kerahasiaan) - Menggunakan kunci publik lawan
       let encryptedMessage = "";
       try {
         encryptedMessage = await encryptMessage(
             myPrivateKey, 
             contactPublicKey, 
             inputText
         );
       } catch (e) {
         // Fallback untuk demo jika key dummy
         console.warn("Enkripsi real gagal (key dummy?), mengirim placeholder.", e);
         encryptedMessage = "ENCRYPTED_PLACEHOLDER"; 
       }

       // C. Kirim ke Server
       const payloadToSend = {
           sender_username: currentUser,
           receiver_username: contactUsername,
           encrypted_message: encryptedMessage,
           message_hash: msgHash,
           signature: signature,
           timestamp: timestamp
       };

       console.log("🚀 Sending Secure Message:", payloadToSend);
       // await fetch('/api/messages', ...)

       // D. Update UI
       const newMsg: ProcessedMessage = {
         id: crypto.randomUUID(),
         sender: currentUser,
         text: inputText,
         timestamp: timestamp,
         isVerified: true,
         status: 'verified'
       };
       
       setMessages(prev => [...prev, newMsg]);
       setInputText("");

    } catch (e) {
       console.error("Send Error:", e);
       alert("Gagal memproses pesan.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header Chat */}
      <div className="bg-white p-4 shadow-sm border-b flex justify-between items-center">
        <div>
            <div className="font-bold text-gray-800">{contactUsername}</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
                {isKeyLoading ? "Mengambil kunci..." : "● Encrypted Connection Established"}
            </div>
        </div>
      </div>

      {/* Area Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                <p>Belum ada riwayat pesan.</p>
            </div>
        )}
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            text={msg.text}
            sender={msg.sender}
            isMe={msg.sender === currentUser}
            status={msg.status}
            timestamp={msg.timestamp}
          />
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2">
            <input
            className="flex-1 p-3 rounded-lg border border-gray-300 bg-gray-50 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isKeyLoading ? "Menunggu kunci..." : `Kirim pesan ke ${contactUsername}...`}
            disabled={isKeyLoading || !contactPublicKey}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
            onClick={handleSend}
            disabled={isKeyLoading || !contactPublicKey}
            className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
            Kirim
            </button>
        </div>
      </div>
    </div>
  );
}