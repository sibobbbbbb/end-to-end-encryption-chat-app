import React, { useState } from 'react';
import { X, Copy, Check, Shield, AlertTriangle } from 'lucide-react';
import { computeKeyFingerprint, formatFingerprint } from '@/lib/crypto';

interface KeyFingerprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactUsername: string;
  currentPublicKey: string;
  previousPublicKey?: string | null;
  onTrustKey?: () => void;
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

export const KeyFingerprintModal: React.FC<KeyFingerprintModalProps> = ({ 
  isOpen, 
  onClose,
  contactUsername,
  currentPublicKey,
  previousPublicKey,
  onTrustKey
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFullFingerprint, setShowFullFingerprint] = useState(false);

  if (!isOpen) return null;

  const currentFingerprint = computeKeyFingerprint(currentPublicKey);
  const previousFingerprint = previousPublicKey ? computeKeyFingerprint(previousPublicKey) : null;
  const hasKeyChanged = previousPublicKey !== null && previousPublicKey !== currentPublicKey;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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
        className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-700 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 flex items-center justify-between ${hasKeyChanged ? 'bg-gradient-to-r from-red-600 to-orange-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield size={24} />
              Key Fingerprint
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {hasKeyChanged ? '⚠️ Public key has changed!' : 'Public key verification'}
            </p>
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
          {/* MITM Warning */}
          {hasKeyChanged && (
            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-400 mb-2">⚠️ Potential Security Risk Detected</h3>
                  <p className="text-xs text-gray-300 mb-3">
                    The public key for <strong>{contactUsername}</strong> has changed. This could indicate:
                  </p>
                  <ul className="text-xs text-gray-300 space-y-1 mb-3 list-disc list-inside">
                    <li>Legitimate key rotation (user regenerated their keys)</li>
                    <li>Man-in-the-Middle (MITM) attack attempt</li>
                    <li>Account compromise</li>
                  </ul>
                  <p className="text-xs text-yellow-400 font-semibold">
                    ⚠️ Verify the new key fingerprint through a secure out-of-band channel before trusting it!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Key Fingerprint */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Shield size={16} className="text-green-400" />
              Current Public Key Fingerprint
            </h3>
            <div className="space-y-3">
              <DetailField 
                label="Fingerprint (SHA-256)" 
                value={showFullFingerprint ? currentFingerprint : formatFingerprint(currentFingerprint)} 
                onCopy={copyToClipboard} 
                copiedField={copiedField} 
              />
              <button
                onClick={() => setShowFullFingerprint(!showFullFingerprint)}
                className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer"
              >
                {showFullFingerprint ? 'Show shortened' : 'Show full fingerprint'}
              </button>
              <DetailField 
                label="Public Key (Hex)" 
                value={currentPublicKey.length > 100 ? `${currentPublicKey.substring(0, 50)}...${currentPublicKey.substring(currentPublicKey.length - 50)}` : currentPublicKey} 
                onCopy={copyToClipboard} 
                copiedField={copiedField} 
              />
            </div>
          </div>

          {/* Previous Key Fingerprint (if changed) */}
          {hasKeyChanged && previousFingerprint && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-red-500/30">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" />
                Previous Public Key Fingerprint
              </h3>
              <DetailField 
                label="Previous Fingerprint (SHA-256)" 
                value={formatFingerprint(previousFingerprint)} 
                onCopy={copyToClipboard} 
                copiedField={copiedField} 
              />
            </div>
          )}

          {/* Comparison */}
          {hasKeyChanged && previousFingerprint && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <h3 className="text-sm font-bold text-yellow-400 mb-2">🔍 Fingerprint Comparison</h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-24">Previous:</span>
                  <span className="text-red-400">{formatFingerprint(previousFingerprint, true).substring(0, 32)}...</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-24">Current:</span>
                  <span className="text-green-400">{formatFingerprint(currentFingerprint, true).substring(0, 32)}...</span>
                </div>
                <div className="pt-2 border-t border-yellow-500/20 text-yellow-300">
                  ❌ Fingerprints do not match!
                </div>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <h3 className="text-sm font-bold text-blue-400 mb-2">📚 About Key Fingerprints</h3>
            <ul className="text-xs text-gray-300 space-y-2">
              <li className="flex gap-2">
                <span className="text-blue-400 flex-shrink-0">•</span>
                <span><strong>Fingerprint:</strong> A unique SHA-256 hash of the public key, used to verify identity</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 flex-shrink-0">•</span>
                <span><strong>Purpose:</strong> Compare fingerprints out-of-band (e.g., phone call, in-person) to prevent MITM attacks</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 flex-shrink-0">•</span>
                <span><strong>ECC:</strong> Uses Elliptic Curve Cryptography (secp256k1) for key generation</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 flex-shrink-0">•</span>
                <span><strong>Security:</strong> If fingerprints match, you can trust the public key belongs to the intended recipient</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        {hasKeyChanged && onTrustKey && (
          <div className="bg-gray-800 p-4 border-t border-gray-700 flex justify-end">
            <button
              onClick={() => {
                onTrustKey();
                onClose();
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl cursor-pointer"
            >
              Trust New Key
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

