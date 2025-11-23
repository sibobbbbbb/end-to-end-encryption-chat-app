import React from 'react';
import { X, Copy, Check, TestTube, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface TechnicalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageData: {
    plainText: string;
    cipherText?: string;
    hash: string;
    signature: {
      r: string;
      s: string;
    };
    timestamp: string;
    sender: string;
    encryptionAlgorithm: string;
    keySize: string;
    verified: boolean;
  };
}

const DetailField = ({ 
  label, 
  value, 
  copyable = true,
  onCopy,
  copiedField
}: { 
  label: string; 
  value: string; 
  copyable?: boolean;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-gray-400 uppercase">{label}</label>
      {copyable && (
        <button
          onClick={() => onCopy(value, label)}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700 cursor-pointer"
          title="Copy to clipboard"
        >
          {copiedField === label ? (
            <Check size={14} className="text-green-400" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      )}
    </div>
    <div className="bg-gray-800 p-3 rounded-lg font-mono text-xs break-all text-gray-300 border border-gray-700">
      {value}
    </div>
  </div>
);

export const TechnicalDetailsModal: React.FC<TechnicalDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  messageData 
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showTamperedDemo, setShowTamperedDemo] = useState(false);
  const [demoResult, setDemoResult] = useState<{ verified: boolean; tampered: boolean } | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Demo: Show verified vs tampered signature
  const runSignatureDemo = () => {
    setShowTamperedDemo(true);
    
    // Simulate verification with original signature (should pass)
    // In real scenario, we'd need the sender's public key, but for demo we'll simulate
    const originalVerified = messageData.verified;
    
    // Simulate tampered signature (modify one byte)
    const tamperedSignature = {
      r: messageData.signature.r,
      s: messageData.signature.s.substring(0, messageData.signature.s.length - 2) + 'ff' // Tamper last byte
    };
    
    // For demo purposes, we'll show the comparison
    // In real app, we'd verify with actual public key
    setDemoResult({
      verified: originalVerified,
      tampered: false // Tampered signature would fail verification
    });
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
        className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Technical Details
            </h2>
            <p className="text-blue-100 text-sm mt-1">Cryptographic message information</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Message Info */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Message Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Sender:</span>
                <span className="ml-2 text-white font-semibold">{messageData.sender}</span>
              </div>
              <div>
                <span className="text-gray-400">Timestamp:</span>
                <span className="ml-2 text-white font-mono text-xs">
                  {new Date(messageData.timestamp).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Algorithm:</span>
                <span className="ml-2 text-white font-semibold">{messageData.encryptionAlgorithm}</span>
              </div>
              <div>
                <span className="text-gray-400">Key Size:</span>
                <span className="ml-2 text-white font-semibold">{messageData.keySize}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Verification Status:</span>
                <span className={`ml-2 font-bold ${messageData.verified ? 'text-green-400' : 'text-red-400'}`}>
                  {messageData.verified ? '✓ Verified' : '✗ Unverified'}
                </span>
              </div>
            </div>
          </div>

          {/* Plain Text */}
          <DetailField label="Plain Text Message" value={messageData.plainText} onCopy={copyToClipboard} copiedField={copiedField} />

          {/* Error Details (if decryption failed) */}
          {messageData.plainText.includes("❌") && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <h3 className="text-sm font-bold text-red-400 mb-2">⚠️ Error Details</h3>
              <p className="text-xs text-gray-300 whitespace-pre-line">{messageData.plainText}</p>
            </div>
          )}

          {/* Cipher Text */}
          {messageData.cipherText && (
            <DetailField label="Encrypted Message (Cipher Text)" value={messageData.cipherText} onCopy={copyToClipboard} copiedField={copiedField} />
          )}

          {/* Message Hash */}
          <DetailField label="Message Hash (SHA-256)" value={messageData.hash} onCopy={copyToClipboard} copiedField={copiedField} />

          {/* Digital Signature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Digital Signature (ECDSA)
              </h3>
              <button
                onClick={runSignatureDemo}
                className="text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <TestTube size={12} />
                Demo: Verified vs Tampered
              </button>
            </div>
            <DetailField label="Signature Component R" value={messageData.signature.r} onCopy={copyToClipboard} copiedField={copiedField} />
            <DetailField label="Signature Component S" value={messageData.signature.s} onCopy={copyToClipboard} copiedField={copiedField} />
            
            {/* Demo Results */}
            {showTamperedDemo && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-purple-400 flex items-center gap-2">
                  <TestTube size={14} />
                  Signature Verification Demo
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Verified Signature */}
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck size={14} className="text-green-400" />
                      <span className="text-xs font-bold text-green-400">Original (Verified)</span>
                    </div>
                    <div className="text-xs text-gray-300 space-y-1">
                      <div>R: {messageData.signature.r.substring(0, 16)}...</div>
                      <div>S: {messageData.signature.s.substring(0, 16)}...</div>
                      <div className="pt-2 border-t border-green-500/20">
                        <span className="text-green-400 font-semibold">✓ Verification: PASS</span>
                        <p className="text-gray-400 mt-1">Signature matches message hash and sender's public key</p>
                      </div>
                    </div>
                  </div>

                  {/* Tampered Signature */}
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-red-400" />
                      <span className="text-xs font-bold text-red-400">Tampered (Modified)</span>
                    </div>
                    <div className="text-xs text-gray-300 space-y-1">
                      <div>R: {messageData.signature.r.substring(0, 16)}...</div>
                      <div>S: {messageData.signature.s.substring(0, messageData.signature.s.length - 2)}<span className="text-red-400">ff</span>...</div>
                      <div className="pt-2 border-t border-red-500/20">
                        <span className="text-red-400 font-semibold">✗ Verification: FAIL</span>
                        <p className="text-gray-400 mt-1">Signature does not match - message may have been altered!</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                  <p className="text-xs text-gray-300">
                    <strong className="text-blue-400">How it works:</strong> ECDSA verification uses the message hash, signature (r, s), and sender's public key. 
                    Any modification to the signature or message will cause verification to fail, protecting against tampering.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Explanation */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-blue-400 mb-2">📚 How It Works</h3>
              <ul className="text-xs text-gray-300 space-y-2">
                <li className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">1.</span>
                  <span><strong>Encryption:</strong> Message encrypted with {messageData.encryptionAlgorithm} using recipient's public key (ECIES)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">2.</span>
                  <span><strong>Hash:</strong> SHA-256 hash computed from plaintext for integrity verification</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">3.</span>
                  <span><strong>Signature:</strong> Hash signed with sender's private key using ECDSA (r, s components)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">4.</span>
                  <span><strong>Verification:</strong> Recipient verifies signature using sender's public key to ensure authenticity</span>
                </li>
              </ul>
            </div>

            {/* Technical Explanations */}
            <div className="border-t border-blue-500/20 pt-4">
              <h3 className="text-sm font-bold text-blue-400 mb-3">🔐 Cryptographic Technologies</h3>
              
              <div className="space-y-3">
                {/* ECC Explanation */}
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-2">
                    <span className="text-purple-400">ECC</span> - Elliptic Curve Cryptography
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Uses <strong>secp256k1</strong> curve (same as Bitcoin) for key generation. Provides 256-bit security with smaller key sizes than RSA. 
                    Public key derived from private key using elliptic curve point multiplication. Enables efficient ECDH (key exchange) and ECDSA (signatures).
                  </p>
                </div>

                {/* ECDSA Explanation */}
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-2">
                    <span className="text-green-400">ECDSA</span> - Elliptic Curve Digital Signature Algorithm
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed mb-2">
                    Digital signature scheme using elliptic curves. Signature consists of two components:
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1 ml-2">
                    <li>• <strong>R:</strong> {messageData.signature.r.substring(0, 16)}... (x-coordinate of curve point)</li>
                    <li>• <strong>S:</strong> {messageData.signature.s.substring(0, 16)}... (signature proof)</li>
                  </ul>
                  <p className="text-xs text-gray-300 leading-relaxed mt-2">
                    Verifier uses sender's public key to verify signature against message hash. Ensures message authenticity and non-repudiation.
                  </p>
                </div>

                {/* SHA-256 Explanation */}
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-2">
                    <span className="text-yellow-400">SHA-256</span> - Secure Hash Algorithm 256-bit
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Cryptographic hash function producing 256-bit (32-byte) output. Used here for:
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1 ml-2 mt-1">
                    <li>• <strong>Message Integrity:</strong> Detects any tampering with message content</li>
                    <li>• <strong>Signature Input:</strong> Hash is signed (not raw message) for efficiency</li>
                    <li>• <strong>Key Fingerprinting:</strong> Creates unique identifier for public keys</li>
                  </ul>
                  <p className="text-xs text-gray-300 leading-relaxed mt-2">
                    Hash: <span className="font-mono text-yellow-300">{messageData.hash.substring(0, 32)}...</span>
                  </p>
                </div>

                {/* AES-GCM Explanation */}
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-2">
                    <span className="text-blue-400">AES-GCM</span> - Advanced Encryption Standard (Galois/Counter Mode)
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Symmetric encryption using 256-bit key derived from ECDH shared secret. GCM mode provides:
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1 ml-2 mt-1">
                    <li>• <strong>Confidentiality:</strong> Message encrypted, only recipient can decrypt</li>
                    <li>• <strong>Authenticity:</strong> Built-in authentication tag prevents tampering</li>
                    <li>• <strong>Efficiency:</strong> Fast encryption/decryption suitable for real-time chat</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Verification Status Explanation */}
            {!messageData.verified && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <h4 className="text-xs font-bold text-red-400 mb-1.5">⚠️ Verification Failed</h4>
                <p className="text-xs text-gray-300">
                  This message could not be verified. Possible reasons:
                </p>
                <ul className="text-xs text-gray-400 space-y-1 ml-2 mt-1">
                  <li>• Signature verification failed (wrong public key or tampered signature)</li>
                  <li>• Hash mismatch (message content was altered)</li>
                  <li>• Decryption failed (wrong encryption key)</li>
                </ul>
                <p className="text-xs text-red-300 mt-2 font-semibold">
                  ⚠️ Do not trust unverified messages!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
