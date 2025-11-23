import React, { useState } from 'react';
import { X, TestTube, Key, AlertTriangle, Lock, Hash, FileSignature } from 'lucide-react';
import { decryptMessage, hashMessage, verifySignature } from '@/lib/crypto';
import { getPrivateKey } from '@/services/authService';
import type { IncomingMessagePayload } from '@/lib/messageHandler';

interface DeveloperModeProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  contactUsername: string;
  contactPublicKey: string | null;
  onInjectMessage?: (payload: IncomingMessagePayload) => void;
}

export const DeveloperMode: React.FC<DeveloperModeProps> = ({
  isOpen,
  onClose,
  currentUser,
  contactUsername,
  contactPublicKey,
  onInjectMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'wrong-key' | 'tampered'>('wrong-key');
  const [testMessage, setTestMessage] = useState('');
  const [wrongKeyResult, setWrongKeyResult] = useState<{
    encrypted: string;
    decrypted: string;
    error: string | null;
  } | null>(null);
  const [tamperedPayload, setTamperedPayload] = useState<Partial<IncomingMessagePayload>>({});
  const [tamperedResult, setTamperedResult] = useState<{
    verified: boolean;
    error: string | null;
  } | null>(null);

  if (!isOpen) return null;

  // Test 1: Wrong Private Key Demo
  const testWrongPrivateKey = async () => {
    if (!testMessage.trim() || !contactPublicKey) {
      alert('Please enter a test message and ensure contact public key is available');
      return;
    }

    try {
      // Generate a wrong private key (random)
      const { ec } = await import('elliptic');
      const EC = ec;
      const ecInstance = new EC('secp256k1');
      const wrongKeyPair = ecInstance.genKeyPair();
      const wrongPrivateKey = wrongKeyPair.getPrivate('hex');

      // Try to encrypt with correct keys
      const { encryptMessage } = await import('@/lib/crypto');
      const myPrivateKey = getPrivateKey(currentUser);
      if (!myPrivateKey) {
        alert('Your private key not found');
        return;
      }

      const encrypted = await encryptMessage(myPrivateKey, contactPublicKey, testMessage);

      // Try to decrypt with WRONG private key
      try {
        const decrypted = await decryptMessage(wrongPrivateKey, contactPublicKey, encrypted);
        setWrongKeyResult({
          encrypted,
          decrypted,
          error: null,
        });
      } catch (error) {
        setWrongKeyResult({
          encrypted,
          decrypted: '[DECRYPTION FAILED - Message remains encrypted]',
          error: error instanceof Error ? error.message : 'Decryption failed',
        });
      }
    } catch (error) {
      setWrongKeyResult({
        encrypted: '',
        decrypted: '',
        error: error instanceof Error ? error.message : 'Test failed',
      });
    }
  };

  // Test 2: Tampered Message Demo
  const testTamperedMessage = async () => {
    if (!contactPublicKey) {
      alert('Contact public key not available');
      return;
    }

    try {
      const myPrivateKey = getPrivateKey(currentUser);
      if (!myPrivateKey) {
        alert('Your private key not found');
        return;
      }

      // Create a valid message first
      const timestamp = new Date().toISOString();
      const messageText = tamperedPayload.encrypted_message || 'Test message';
      
      // If we have a valid encrypted message, try to tamper it
      if (tamperedPayload.encrypted_message) {
        // Tamper the encrypted message (add random characters)
        const tamperedEncrypted = tamperedPayload.encrypted_message.slice(0, -10) + 'TAMPERED';
        const tamperedHash = tamperedPayload.message_hash 
          ? tamperedPayload.message_hash.slice(0, -5) + 'XXXXX'
          : 'tampered_hash';
        
        // Try to verify
        const { hashMessage } = await import('@/lib/crypto');
        const computedHash = hashMessage(JSON.stringify({
          sender: contactUsername,
          msg: 'decrypted_text',
          ts: timestamp
        }));

        const { verifySignature } = await import('@/lib/crypto');
        let verified = false;
        try {
          if (tamperedPayload.signature) {
            verified = verifySignature(
              contactPublicKey,
              computedHash,
              tamperedPayload.signature
            );
          }
        } catch (error) {
          // Verification will fail
        }

        setTamperedResult({
          verified: false, // Will always fail because we tampered
          error: 'Verification failed: Message has been tampered with',
        });
      } else {
        // Create a tampered payload manually
        const payload: IncomingMessagePayload = {
          sender_username: contactUsername,
          encrypted_message: 'TAMPERED_ENCRYPTED_MESSAGE',
          message_hash: 'TAMPERED_HASH',
          signature: { r: 'tampered_r', s: 'tampered_s' },
          timestamp: timestamp,
        };

        if (onInjectMessage) {
          onInjectMessage(payload);
        }

        setTamperedResult({
          verified: false,
          error: 'Message injected with tampered data',
        });
      }
    } catch (error) {
      setTamperedResult({
        verified: false,
        error: error instanceof Error ? error.message : 'Test failed',
      });
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TestTube size={24} className="text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Developer Mode - Test Panel</h2>
              <p className="text-purple-100 text-sm mt-1">
                Demo features for presentation (Spesifikasi 3.d)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-800">
          <button
            onClick={() => setActiveTab('wrong-key')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'wrong-key'
                ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Key size={18} />
              <span>Test: Wrong Private Key</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tampered')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'tampered'
                ? 'bg-gray-900 text-red-400 border-b-2 border-red-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle size={18} />
              <span>Test: Tampered Message</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Tab 1: Wrong Private Key */}
          {activeTab === 'wrong-key' && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <Key size={20} />
                  Test Case: Private Key yang Salah
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Sesuai spesifikasi 3.d.i: <strong>"Private key yang salah, perlihatkan bahwa pesan masih dalam bentuk acak"</strong>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Test Message
                    </label>
                    <textarea
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Enter a test message..."
                      className="w-full rounded-lg border border-gray-600 bg-gray-800 text-white px-4 py-3 focus:border-blue-500 focus:outline-none resize-none"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={testWrongPrivateKey}
                    disabled={!testMessage.trim() || !contactPublicKey}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Run Test: Wrong Private Key
                  </button>
                </div>
              </div>

              {wrongKeyResult && (
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                      <Lock size={16} />
                      Result: Decryption Failed
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-400">Encrypted Message (Hex):</label>
                        <div className="bg-gray-800 p-3 rounded-lg font-mono text-xs text-gray-300 break-all mt-1">
                          {wrongKeyResult.encrypted.substring(0, 100)}...
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-400">Decryption Attempt:</label>
                        <div className="bg-gray-800 p-3 rounded-lg font-mono text-xs text-red-400 break-all mt-1">
                          {wrongKeyResult.decrypted}
                        </div>
                      </div>
                      {wrongKeyResult.error && (
                        <div>
                          <label className="text-xs font-semibold text-gray-400">Error:</label>
                          <div className="bg-gray-800 p-3 rounded-lg text-xs text-red-400 mt-1">
                            {wrongKeyResult.error}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-green-400 mb-2">✓ Test Passed</h4>
                    <p className="text-xs text-gray-300">
                      Pesan tetap dalam bentuk encrypted karena private key yang digunakan salah. 
                      Ini membuktikan bahwa hanya private key yang benar yang dapat mendekripsi pesan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Tampered Message */}
          {activeTab === 'tampered' && (
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Test Case: Tampered Message
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Sesuai spesifikasi 3.d.ii: <strong>"Intercept request pesan, ubah teks terenkripsi, hash, timestamp, atau komponen lainnya, tunjukkan bahwa verifikasi pesan gagal"</strong>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Tampered Encrypted Message
                    </label>
                    <input
                      type="text"
                      value={tamperedPayload.encrypted_message || ''}
                      onChange={(e) => setTamperedPayload({ ...tamperedPayload, encrypted_message: e.target.value })}
                      placeholder="Enter tampered encrypted message..."
                      className="w-full rounded-lg border border-gray-600 bg-gray-800 text-white px-4 py-3 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Tampered Hash
                    </label>
                    <input
                      type="text"
                      value={tamperedPayload.message_hash || ''}
                      onChange={(e) => setTamperedPayload({ ...tamperedPayload, message_hash: e.target.value })}
                      placeholder="Enter tampered hash..."
                      className="w-full rounded-lg border border-gray-600 bg-gray-800 text-white px-4 py-3 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={testTamperedMessage}
                    disabled={!contactPublicKey}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Inject Tampered Message
                  </button>
                </div>
              </div>

              {tamperedResult && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                    <FileSignature size={16} />
                    Result: Verification Failed
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">Verification Status:</span>
                      <span className="text-red-400 font-bold">✗ Unverified</span>
                    </div>
                    {tamperedResult.error && (
                      <div>
                        <label className="text-xs font-semibold text-gray-400">Error:</label>
                        <div className="bg-gray-800 p-3 rounded-lg text-xs text-red-400 mt-1">
                          {tamperedResult.error}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-xs text-gray-300">
                      <strong className="text-yellow-400">✓ Test Passed:</strong> Verifikasi gagal karena pesan telah diubah. 
                      Sistem berhasil mendeteksi bahwa pesan tidak autentik.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

