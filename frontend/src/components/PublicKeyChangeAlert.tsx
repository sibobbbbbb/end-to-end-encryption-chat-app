import React from 'react';
import { X } from 'lucide-react';

interface PublicKeyChangeAlertProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  oldKey: string | null;
  newKey: string | null;
  onAcceptNewKey: () => void;
  onReject: () => void;
  onViewFingerprint: () => void;
}

export const PublicKeyChangeAlert: React.FC<PublicKeyChangeAlertProps> = ({
  isOpen,
  onClose,
  username,
  oldKey,
  newKey,
  onAcceptNewKey,
  onReject,
  onViewFingerprint
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl w-full max-w-xl border border-red-700 shadow-lg overflow-hidden">
        <div className="p-5 bg-red-700/80 flex items-start justify-between">
          <div>
            <h3 className="text-white font-bold">Public Key Changed</h3>
            <p className="text-red-100 text-sm mt-1">Potential security issue for <strong>{username}</strong></p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2 rounded-lg">
            <X />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-300">We detected that the stored public key for <strong>{username}</strong> differs from the one currently fetched from the server. This can indicate a legitimate key rotation or a possible man-in-the-middle attack.</p>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-gray-800 p-3 rounded border border-gray-700">
              <div className="text-xs text-gray-400">Previously Known Public Key</div>
              <div className="mt-2 font-mono text-xs text-gray-200 break-all">{oldKey || '(none)'}</div>
            </div>
            <div className="bg-gray-800 p-3 rounded border border-gray-700">
              <div className="text-xs text-gray-400">New Public Key</div>
              <div className="mt-2 font-mono text-xs text-gray-200 break-all">{newKey || '(not available)'}</div>
            </div>
          </div>

          <div className="text-xs text-gray-400">Recommended actions: Compare fingerprints via a trusted channel before accepting. If you don't recognize this change, reject and contact the user through another channel.</div>
        </div>

        <div className="p-4 border-t border-red-700/30 flex gap-3 justify-end">
          <button onClick={onViewFingerprint} className="bg-gray-700 px-4 py-2 rounded text-white">View Fingerprints</button>
          <button onClick={onReject} className="bg-red-600 px-4 py-2 rounded text-white">Reject (Block)</button>
          <button onClick={onAcceptNewKey} className="bg-green-600 px-4 py-2 rounded text-white font-semibold">Accept Key</button>
        </div>
      </div>
    </div>
  );
};
