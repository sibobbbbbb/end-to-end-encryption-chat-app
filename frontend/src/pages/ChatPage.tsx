import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { ChatBubble } from '@/components/ChatBubble';
import { TechnicalDetailsModal } from '@/components/TechnicalDetailsModal';
import { processIncomingMessage, type ProcessedMessage, type IncomingMessagePayload } from '@/lib/messageHandler';
import { encryptMessage, hashMessage, signMessage } from '@/lib/crypto';
import { getPrivateKey } from '@/services/authService';
import { getContactProfile } from '@/services/userService';

interface ChatPageProps {
  currentUser: string;
  contactUsername: string;
}

export default function ChatPage({ currentUser, contactUsername }: ChatPageProps) {
  const [messages, setMessages] = useState<ProcessedMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [contactPublicKey, setContactPublicKey] = useState<string | null>(null);
  const [isKeyLoading, setIsKeyLoading] = useState(false);
  const [selectedMessageForDetails, setSelectedMessageForDetails] = useState<ProcessedMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll ke pesan terbaru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, [inputText]);

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
      } catch {
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
       
       // Reset textarea height
       if (textareaRef.current) {
         textareaRef.current.style.height = 'auto';
       }

    } catch (e) {
       console.error("Send Error:", e);
       alert("Gagal memproses pesan.");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-800 to-gray-900">
      {/* Header Chat */}
      <div className="bg-gray-800/80 backdrop-blur-sm p-5 shadow-md border-b border-gray-700/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-400 to-purple-400 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="font-bold text-gray-100 text-lg">{contactUsername}</div>
              <div className="text-xs text-green-400 flex items-center gap-1">
                  {isKeyLoading ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Securing connection...
                    </span>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      End-to-end encrypted
                    </>
                  )}
              </div>
            </div>
        </div>
      </div>

      {/* Area Chat */}
      <div className="flex-1 overflow-y-auto py-6 px-6 space-y-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-2xl mb-4 border border-gray-600">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-400 font-medium">No messages yet</p>
                <p className="text-sm text-gray-500">Start your encrypted conversation</p>
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
            encryptionAlgorithm="ECC-256"
            signatureDetails={msg.signature ? {
              r: msg.signature.r,
              s: msg.signature.s,
              hash: msg.hash || ''
            } : undefined}
            onShowDetails={() => setSelectedMessageForDetails(msg)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-5 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 shadow-lg">
        <div className="flex gap-3 items-end">
            <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all resize-none overflow-y-auto leading-relaxed"
            style={{ minHeight: '52px', maxHeight: '150px' }}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isKeyLoading ? "Securing connection..." : `Message ${contactUsername}... (Shift+Enter for new line)`}
            disabled={isKeyLoading || !contactPublicKey}
            onKeyDown={handleKeyDown}
            />
            <button 
            onClick={handleSend}
            disabled={isKeyLoading || !contactPublicKey || !inputText.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
            </button>
        </div>
      </div>

      {/* Technical Details Modal */}
      {selectedMessageForDetails && (
        <TechnicalDetailsModal
          isOpen={!!selectedMessageForDetails}
          onClose={() => setSelectedMessageForDetails(null)}
          messageData={{
            plainText: selectedMessageForDetails.text,
            cipherText: selectedMessageForDetails.encryptedMessage,
            hash: selectedMessageForDetails.hash || 'N/A',
            signature: selectedMessageForDetails.signature || { r: '', s: '' },
            timestamp: selectedMessageForDetails.timestamp,
            sender: selectedMessageForDetails.sender,
            encryptionAlgorithm: 'ECC (Elliptic Curve Cryptography)',
            keySize: '256-bit',
            verified: selectedMessageForDetails.status === 'verified'
          }}
        />
      )}
    </div>
  );
}