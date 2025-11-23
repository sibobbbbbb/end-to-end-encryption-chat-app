import React from 'react';
import { X, Copy, Check } from 'lucide-react';
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

  if (!isOpen) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-700">
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
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
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

          {/* Cipher Text */}
          {messageData.cipherText && (
            <DetailField label="Encrypted Message (Cipher Text)" value={messageData.cipherText} onCopy={copyToClipboard} copiedField={copiedField} />
          )}

          {/* Message Hash */}
          <DetailField label="Message Hash (SHA-256)" value={messageData.hash} onCopy={copyToClipboard} copiedField={copiedField} />

          {/* Digital Signature */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Digital Signature (ECDSA)
            </h3>
            <DetailField label="Signature Component R" value={messageData.signature.r} onCopy={copyToClipboard} copiedField={copiedField} />
            <DetailField label="Signature Component S" value={messageData.signature.s} onCopy={copyToClipboard} copiedField={copiedField} />
          </div>

          {/* Explanation */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
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
