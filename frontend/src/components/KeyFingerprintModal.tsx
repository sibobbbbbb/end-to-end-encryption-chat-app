import React from 'react';
import { X } from 'lucide-react';
import { sha3_256 } from 'js-sha3';

interface KeyFingerprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  publicKey: string | null;
  localFingerprint?: string | null; // optional: user's own fingerprint to compare
}

export const KeyFingerprintModal: React.FC<KeyFingerprintModalProps> = ({ isOpen, onClose, username, publicKey, localFingerprint }) => {
  if (!isOpen) return null;

  const fingerprint = publicKey ? sha3_256(publicKey) : '';

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-600 to-purple-600">
          <div>
            <h3 className="text-lg font-bold text-white">Public Key Fingerprint</h3>
            <p className="text-sm text-blue-100">{username}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2 rounded-lg">
            <X />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-400">Public Key</label>
            <div className="mt-2 bg-gray-800 p-3 rounded font-mono text-xs text-gray-200 break-all border border-gray-700">
              {publicKey || "(Not available)"}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400">Fingerprint (SHA3-256)</label>
            <div className="mt-2 flex items-start gap-3">
              <div className="flex-1 bg-gray-800 p-3 rounded font-mono text-xs text-gray-200 break-all border border-gray-700">
                {fingerprint}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => copyToClipboard(fingerprint)} className="bg-blue-600 px-3 py-2 rounded text-white cursor-pointer">Copy</button>
              </div>
            </div>
          </div>

          {localFingerprint && (
            <div className="bg-gray-800 p-3 rounded border border-gray-700">
              <div className="text-xs text-gray-400">Comparison</div>
              <div className="mt-2 font-mono text-sm">
                <div>Local: {localFingerprint}</div>
                <div>Remote: {fingerprint}</div>
              </div>
              <div className={`mt-3 font-semibold ${localFingerprint === fingerprint ? 'text-green-400' : 'text-red-400'}`}>
                {localFingerprint === fingerprint ? 'Fingerprints match' : 'Fingerprints do NOT match'}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400">
            Tip: Verify fingerprints out-of-band (voice, QR, or other channel) to prevent MITM attacks.
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button onClick={onClose} className="bg-gray-700 px-4 py-2 rounded text-white">Close</button>
        </div>
      </div>
    </div>
  );
};

// No local hash implementation here — rely on `js-sha3` for fingerprinting.
