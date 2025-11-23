import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { ChatBubble } from '@/components/ChatBubble';
import { TechnicalDetailsModal } from '@/components/TechnicalDetailsModal';
import { KeyFingerprintModal } from '@/components/KeyFingerprintModal';
import { processIncomingMessage, type ProcessedMessage, type IncomingMessagePayload } from '@/lib/messageHandler';
import { encryptMessage, hashMessage, signMessage, computeKeyFingerprint } from '@/lib/crypto';
import { getPrivateKey } from '@/services/authService';
import { getContactProfile } from '@/services/userService';
import { savePublicKey, getStoredPublicKey, trustNewKey } from '@/lib/keyStorage';

interface ChatPageProps {
  currentUser: string;
  contactUsername: string;
}

export default function ChatPage({ currentUser, contactUsername }: ChatPageProps) {
  const [messages, setMessages] = useState<ProcessedMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [contactPublicKey, setContactPublicKey] = useState<string | null>(null);
  const [previousPublicKey, setPreviousPublicKey] = useState<string | null>(null);
  const [isKeyLoading, setIsKeyLoading] = useState(false);
  const [selectedMessageForDetails, setSelectedMessageForDetails] = useState<ProcessedMessage | null>(null);
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  const [showKeyChangeAlert, setShowKeyChangeAlert] = useState(false);
  const [showVerificationInfo, setShowVerificationInfo] = useState(false);
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
      setShowKeyChangeAlert(false);
      setPreviousPublicKey(null);

      try {
        const profile = await getContactProfile(contactUsername);
        if (profile) {
          const newPublicKey = profile.publicKey;
          
          // Cek apakah key berubah
          const storedKeyInfo = getStoredPublicKey(contactUsername);
          if (storedKeyInfo && storedKeyInfo.publicKey !== newPublicKey) {
            // Key berubah - tampilkan alert
            setPreviousPublicKey(storedKeyInfo.publicKey);
            setShowKeyChangeAlert(true);
            setShowFingerprintModal(true);
          } else if (storedKeyInfo && storedKeyInfo.publicKey === newPublicKey) {
            // Key sama, update last seen
            // updateLastSeen sudah di-handle di savePublicKey
          }
          
          // Simpan key baru
          const fingerprint = computeKeyFingerprint(newPublicKey);
          savePublicKey(contactUsername, newPublicKey, fingerprint);
          
          setContactPublicKey(newPublicKey);
          console.log(`Public key ${contactUsername} didapat:`, newPublicKey);
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
        alert("Failed to get recipient's encryption key. Check connection or user may be invalid.");
        return;
    }

    try {
       const myPrivateKey = getPrivateKey(currentUser);
       if (!myPrivateKey) {
           alert("Invalid session (Private Key missing). Please login again.");
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
       alert("Failed to process message.");
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
            <div className="flex-1">
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
              {!isKeyLoading && (
                <button
                  onClick={() => setShowVerificationInfo(!showVerificationInfo)}
                  className="text-[10px] text-gray-400 hover:text-gray-300 mt-1 underline cursor-pointer"
                  title="Learn about verification indicators"
                >
                  {showVerificationInfo ? 'Hide' : 'What do verification indicators mean?'}
                </button>
              )}
            </div>
        </div>
        {!isKeyLoading && contactPublicKey && (
          <button
            onClick={() => setShowFingerprintModal(true)}
            className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-gray-600 hover:border-gray-500 transition-all flex items-center gap-2 cursor-pointer"
            title="View key fingerprint"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Fingerprint
          </button>
        )}
      </div>

      {/* Key Change Alert Banner */}
      {showKeyChangeAlert && previousPublicKey && contactPublicKey && (
        <div className="bg-red-600/90 backdrop-blur-sm p-4 border-b border-red-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="text-white font-semibold text-sm">⚠️ Public Key Changed!</div>
                <div className="text-red-100 text-xs mt-0.5">The public key for {contactUsername} has changed. This may indicate a security risk.</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFingerprintModal(true)}
                className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                View Details
              </button>
              <button
                onClick={() => setShowKeyChangeAlert(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Info Banner */}
      {showVerificationInfo && (
        <div className="bg-blue-600/90 backdrop-blur-sm p-4 border-b border-blue-500/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Message Verification Indicators Explained
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-400 font-bold">Verified</span>
                  </div>
                  <p className="text-blue-100 text-[11px] leading-relaxed">
                    Message has been successfully verified. ECDSA signature is valid, message hash matches, and message has not been altered. Message is safe and authentic.
                  </p>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-400 font-bold">Unverified</span>
                  </div>
                  <p className="text-blue-100 text-[11px] leading-relaxed">
                    Message could not be verified. Signature is invalid or does not match. Sender's public key may be incorrect. Do not trust this message.
                  </p>
                </div>
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-400 font-bold">Tampered</span>
                  </div>
                  <p className="text-blue-100 text-[11px] leading-relaxed">
                    Message may have been altered or corrupted. Decryption failed or format is invalid. Message may have been tampered with. DO NOT TRUST this message!
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowVerificationInfo(false)}
              className="text-white/80 hover:text-white ml-4 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

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
                {!showVerificationInfo && (
                  <button
                    onClick={() => setShowVerificationInfo(true)}
                    className="mt-4 text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer"
                  >
                    Learn about verification indicators
                  </button>
                )}
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

      {/* Key Fingerprint Modal */}
      {contactPublicKey && (
        <KeyFingerprintModal
          isOpen={showFingerprintModal}
          onClose={() => setShowFingerprintModal(false)}
          contactUsername={contactUsername}
          currentPublicKey={contactPublicKey}
          previousPublicKey={previousPublicKey}
          onTrustKey={() => {
            if (contactPublicKey) {
              const fingerprint = computeKeyFingerprint(contactPublicKey);
              trustNewKey(contactUsername, contactPublicKey, fingerprint);
              setPreviousPublicKey(null);
              setShowKeyChangeAlert(false);
            }
          }}
        />
      )}
    </div>
  );
}