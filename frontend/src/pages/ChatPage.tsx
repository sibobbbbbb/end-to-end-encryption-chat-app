import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { ChatBubble } from '@/components/ChatBubble';
import { TechnicalDetailsModal } from '@/components/TechnicalDetailsModal';
import { KeyFingerprintModal } from '@/components/KeyFingerprintModal';
import { DeveloperMode } from '@/components/DeveloperMode';
import { ToastContainer, useToast, showToast } from '@/components/Toast';
import { processIncomingMessage, type ProcessedMessage, type IncomingMessagePayload } from '@/lib/messageHandler';
import { encryptMessage, hashMessage, signMessage, computeKeyFingerprint } from '@/lib/crypto';
import { getPrivateKey } from '@/services/authService';
import { getContactProfile } from '@/services/userService';
import { savePublicKey, getStoredPublicKey, trustNewKey } from '@/lib/keyStorage';
import { sendMessage, pollMessages } from '@/services/messageService';
import { TestTube } from 'lucide-react';

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
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedMessageForDetails, setSelectedMessageForDetails] = useState<ProcessedMessage | null>(null);
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  const [showKeyChangeAlert, setShowKeyChangeAlert] = useState(false);
  const [showVerificationInfo, setShowVerificationInfo] = useState(false);
  const [showDeveloperMode, setShowDeveloperMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastPollTimestampRef = useRef<string | null>(null);
  const { toasts, removeToast } = useToast();

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
        let newPublicKey: string | null = null;
        
        if (profile && profile.publicKey) {
          newPublicKey = profile.publicKey;
        } else {
          // If profile is null or has no public key, generate fallback key
          console.warn(`❌ User ${contactUsername} tidak ditemukan atau tidak ada public key. Using fallback...`);
          // Import generateDummyPublicKey from userService (we'll need to export it)
          // For now, use stored key if available, otherwise generate new one
          const storedKeyInfo = getStoredPublicKey(contactUsername);
          if (storedKeyInfo && storedKeyInfo.publicKey) {
            newPublicKey = storedKeyInfo.publicKey;
            console.log(`Using stored public key for ${contactUsername}`);
          } else {
            // Generate a dummy key using the same method as userService
            const { ec } = await import('elliptic');
            const { sha3_256 } = await import('js-sha3');
            const EC = ec;
            const ecInstance = new EC('secp256k1');
            const seed = `dummy_key_${contactUsername}`;
            const privateKeyHex = sha3_256(seed);
            const key = ecInstance.keyFromPrivate(privateKeyHex);
            newPublicKey = key.getPublic('hex');
            console.log(`Generated fallback public key for ${contactUsername}`);
          }
        }
        
        if (newPublicKey) {
          // Validate public key format (should be hex string)
          if (newPublicKey.length < 10) {
            console.error(`Invalid public key received for ${contactUsername}:`, newPublicKey);
            showToast(`Failed to get valid public key for ${contactUsername}`, 'error');
            return;
          }
          
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
          console.log(`✅ Public key ${contactUsername} didapat:`, newPublicKey.substring(0, 20) + '...');
        } else {
          console.error(`❌ Failed to get or generate public key for ${contactUsername}`);
          showToast(`Failed to get public key for ${contactUsername}`, 'error');
        }
      } catch (error) {
        console.error(`Error fetching profile for ${contactUsername}:`, error);
        showToast(`Error loading contact ${contactUsername}`, 'error');
      } finally {
        setIsKeyLoading(false);
      }
    };

    fetchKey();
  }, [contactUsername]);

  // 2. Polling Pesan (Hanya jalan jika Public Key sudah ada)
  useEffect(() => {
    if (!contactPublicKey) return;

    // Load initial messages
    const loadInitialMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const fetchedMessages = await pollMessages(contactUsername);
        if (fetchedMessages.length > 0) {
          const processedMessages: ProcessedMessage[] = [];
          
          for (const msg of fetchedMessages) {
            try {
              const processed = await processIncomingMessage(
                {
                  sender_username: msg.sender_username,
                  encrypted_message: msg.encrypted_message,
                  message_hash: msg.message_hash,
                  signature: msg.signature,
                  timestamp: msg.timestamp
                },
                contactPublicKey,
                currentUser
              );
              processedMessages.push(processed);
            } catch (error) {
              console.error("Failed to process message:", error);
              // Continue processing other messages
            }
          }
          
          setMessages(processedMessages);
          if (processedMessages.length > 0) {
            lastPollTimestampRef.current = processedMessages[processedMessages.length - 1].timestamp;
          }
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadInitialMessages();

    // Poll for new messages every 3 seconds
    const interval = setInterval(async () => {
      try {
        const fetchedMessages = await pollMessages(
          contactUsername,
          lastPollTimestampRef.current || undefined
        );

        if (fetchedMessages.length > 0) {
          const newProcessedMessages: ProcessedMessage[] = [];
          
          for (const msg of fetchedMessages) {
            try {
              const processed = await processIncomingMessage(
                {
                  sender_username: msg.sender_username,
                  encrypted_message: msg.encrypted_message,
                  message_hash: msg.message_hash,
                  signature: msg.signature,
                  timestamp: msg.timestamp
                },
                contactPublicKey,
                currentUser
              );
              newProcessedMessages.push(processed);
            } catch (error) {
              console.error("Failed to process message:", error);
            }
          }

          if (newProcessedMessages.length > 0) {
            setMessages(prev => {
              // Filter out duplicates based on timestamp
              const existingTimestamps = new Set(prev.map(m => m.timestamp));
              const uniqueNew = newProcessedMessages.filter(m => !existingTimestamps.has(m.timestamp));
              
              if (uniqueNew.length > 0) {
                lastPollTimestampRef.current = uniqueNew[uniqueNew.length - 1].timestamp;
                return [...prev, ...uniqueNew];
              }
              return prev;
            });
          }
        }
      } catch (error) {
        // Silent catch untuk polling - errors are logged but don't break the app
        console.warn("Polling error:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [currentUser, contactUsername, contactPublicKey]); 

  // 3. Handle Kirim Pesan
  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    
    if (!contactPublicKey) {
        showToast("Failed to get recipient's encryption key. Check connection or user may be invalid.", 'error');
        return;
    }

    setIsSending(true);
    setSendError(null);
    const messageText = inputText.trim();
    setInputText(""); // Clear input immediately for better UX

    try {
       const myPrivateKey = getPrivateKey(currentUser);
       if (!myPrivateKey) {
           showToast("Invalid session (Private Key missing). Please login again.", 'error');
           setIsSending(false);
           return;
       }

       // A. Hash & Sign (Integritas & Autentikasi)
       const timestamp = new Date().toISOString();
       const rawPayload = JSON.stringify({
           sender: currentUser,
           receiver: contactUsername,
           msg: messageText,
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
             messageText
         );
       } catch {
         showToast("Encryption failed. Please try again.", 'error');
         setIsSending(false);
         setInputText(messageText); // Restore message text
         return;
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

       try {
         await sendMessage(payloadToSend);
         console.log("✅ Message sent successfully");

         // D. Update UI optimistically (message will also come via polling)
         const newMsg: ProcessedMessage = {
           id: crypto.randomUUID(),
           sender: currentUser,
           text: messageText,
           timestamp: timestamp,
           isVerified: true,
           status: 'verified'
         };
         
         setMessages(prev => [...prev, newMsg]);
       } catch (sendError) {
         // Restore message text on send failure
         setInputText(messageText);
         const errorMessage = sendError instanceof Error 
           ? sendError.message 
           : "Failed to send message. Please check your connection and try again.";
         showToast(errorMessage, 'error');
         throw sendError;
       }
       
       // Reset textarea height
       if (textareaRef.current) {
         textareaRef.current.style.height = 'auto';
       }

    } catch (e) {
       console.error("Send Error:", e);
       // Error already handled above
    } finally {
       setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handler untuk inject tampered message dari Developer Mode
  const handleInjectMessage = async (payload: IncomingMessagePayload) => {
    if (!contactPublicKey) {
      showToast("Contact public key not available", 'error');
      return;
    }

    try {
      const processed = await processIncomingMessage(
        payload,
        contactPublicKey,
        currentUser
      );
      setMessages(prev => [...prev, processed]);
      showToast("Tampered message injected. Verification should fail.", 'warning');
    } catch (error) {
      console.error("Failed to process injected message:", error);
      showToast("Failed to inject message", 'error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-800 to-gray-900">
      {/* Header Chat */}
      <div className="bg-gray-800/80 backdrop-blur-sm p-3 sm:p-5 shadow-md border-b border-gray-700/50 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-400 to-purple-400 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-100 text-base sm:text-lg truncate">{contactUsername}</div>
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
        <div className="flex items-center gap-2">
          {/* Developer Mode - Always available for testing, even without public key */}
          {!isKeyLoading && (
            <button
              onClick={() => setShowDeveloperMode(true)}
              className={`text-xs px-2 sm:px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 sm:gap-2 cursor-pointer ${
                contactPublicKey
                  ? 'text-purple-400 hover:text-purple-300 border-purple-600/50 hover:border-purple-500'
                  : 'text-purple-300/70 hover:text-purple-300 border-purple-600/30 hover:border-purple-500/50'
              }`}
              title="Developer Mode - Test Panel (Spesifikasi 3.d)"
            >
              <TestTube size={14} />
              <span className="hidden sm:inline md:hidden">Dev</span>
              <span className="hidden md:inline">Developer Mode</span>
            </button>
          )}
          {/* Fingerprint - Only show if public key available */}
          {!isKeyLoading && contactPublicKey && (
            <button
              onClick={() => setShowFingerprintModal(true)}
              className="text-xs text-gray-400 hover:text-white px-2 sm:px-3 py-1.5 rounded-lg border border-gray-600 hover:border-gray-500 transition-all flex items-center gap-1 sm:gap-2 cursor-pointer"
              title="View key fingerprint"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="hidden sm:inline">Fingerprint</span>
            </button>
          )}
        </div>
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
        {isLoadingMessages && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-2xl mb-4 border border-gray-600">
              <svg className="animate-spin h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-gray-400 font-medium">Loading messages...</p>
          </div>
        )}
        {!isLoadingMessages && messages.length === 0 && (
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
      <div className="p-3 sm:p-5 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 shadow-lg">
        {/* Error Message */}
        {sendError && (
          <div className="mb-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{sendError}</span>
            <button
              onClick={() => setSendError(null)}
              className="ml-auto text-red-300 hover:text-red-200 cursor-pointer"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex gap-2 sm:gap-3 items-end">
            <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl border-2 border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all resize-none overflow-y-auto leading-relaxed text-sm sm:text-base"
            style={{ minHeight: '44px', maxHeight: '150px' }}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isKeyLoading ? "Securing connection..." : isSending ? "Sending message..." : `Message ${contactUsername}... (Shift+Enter for new line)`}
            disabled={isKeyLoading || !contactPublicKey || isSending}
            onKeyDown={handleKeyDown}
            />
            <button 
            onClick={handleSend}
            disabled={isKeyLoading || !contactPublicKey || !inputText.trim() || isSending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed text-sm sm:text-base"
            >
            {isSending ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </>
            )}
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

      {/* Developer Mode Modal */}
      <DeveloperMode
        isOpen={showDeveloperMode}
        onClose={() => setShowDeveloperMode(false)}
        currentUser={currentUser}
        contactUsername={contactUsername}
        contactPublicKey={contactPublicKey}
        onInjectMessage={handleInjectMessage}
      />

      {/* Developer Mode Modal */}
      <DeveloperMode
        isOpen={showDeveloperMode}
        onClose={() => setShowDeveloperMode(false)}
        currentUser={currentUser}
        contactUsername={contactUsername}
        contactPublicKey={contactPublicKey}
        onInjectMessage={handleInjectMessage}
      />

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

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}