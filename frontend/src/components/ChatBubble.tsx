import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock } from 'lucide-react';

interface ChatBubbleProps {
  text: string;
  sender: string;
  isMe: boolean;
  status: 'verified' | 'unverified' | 'corrupted';
  timestamp: string;
  encryptionAlgorithm?: string;
  signatureDetails?: {
    r: string;
    s: string;
    hash: string;
  };
  onShowDetails?: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  text, 
  sender, 
  isMe, 
  status, 
  timestamp, 
  encryptionAlgorithm = 'ECC-256',
  signatureDetails,
  onShowDetails 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Warna dan Icon berdasarkan status keamanan
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return { 
          color: 'text-green-400', 
          bgColor: 'bg-green-500/20', 
          icon: <ShieldCheck size={14} />, 
          label: '✓ Verified', // Sesuai spesifikasi: "✓ Verified"
          description: '✓ Signature verified, message authentic',
          fullExplanation: 'Message has been successfully verified:\n• ECDSA signature is valid\n• Message hash matches\n• Message has not been altered\n• Sent by the correct sender'
        };
      case 'unverified':
        return { 
          color: 'text-yellow-400', 
          bgColor: 'bg-yellow-500/20', 
          icon: <ShieldAlert size={14} />, 
          label: '✗ Unverified', // Sesuai spesifikasi: "✗ Unverified"
          description: '⚠ Could not verify signature',
          fullExplanation: 'Message could not be verified:\n• Signature is invalid or does not match\n• Message hash does not match\n• Sender\'s public key may be incorrect\n• Do not trust this message!'
        };
      case 'corrupted':
        return { 
          color: 'text-red-400', 
          bgColor: 'bg-red-500/20', 
          icon: <AlertTriangle size={14} />, 
          label: 'Tampered',
          description: '⚠ Message may have been altered!',
          fullExplanation: 'Message may have been altered or corrupted:\n• Decryption failed\n• Invalid format\n• Signature does not match\n• Message may have been tampered with!\n• DO NOT TRUST this message!'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300 w-full px-2`}>
      <div 
        className={`max-w-[85%] sm:max-w-[70%] min-w-[120px] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-md ${ 
          isMe 
            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' 
            : 'bg-gray-700 text-gray-100 border border-gray-600'
        }`}
        style={{ 
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          whiteSpace: 'pre-wrap'
        }}
      >
        {/* Header: Sender Name */}
        {!isMe && <div className="text-xs font-bold mb-1.5 text-gray-400">{sender}</div>}
        
        {/* Message Body */}
        <p className="leading-relaxed text-[15px]">{text}</p>
        
        {/* Footer: Timestamp & Security Status */}
        <div className={`flex items-center justify-between gap-3 mt-2 pt-2 ${isMe ? 'border-t border-white/20' : 'border-t border-gray-600'}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-medium ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
              {new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            
            {/* Encryption Algorithm Badge */}
            <div className={`flex items-center gap-1 text-[10px] ${isMe ? 'text-white/60' : 'text-gray-500'}`}>
              <Lock size={10} />
              <span>{encryptionAlgorithm}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Security Status Indicator */}
            {!isMe && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={onShowDetails}
                  className={`flex items-center gap-1 text-[10px] font-semibold ${config.color} ${config.bgColor} px-2 py-1 rounded-full hover:opacity-80 transition-opacity cursor-pointer`}
                  title="Click for technical details"
                >
                  {config.icon}
                  <span>{config.label}</span>
                </button>
                
                {/* Tooltip */}
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10 border border-gray-700 max-w-xs">
                    <div className="font-semibold mb-2 text-sm">{config.description}</div>
                    <div className="text-gray-300 text-[11px] leading-relaxed whitespace-pre-line mb-2">
                      {config.fullExplanation}
                    </div>
                    {signatureDetails && (
                      <div className="pt-2 border-t border-gray-700">
                        <div className="text-gray-400 text-[10px] space-y-1 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Hash:</span>
                            <span className="text-yellow-300">{signatureDetails.hash.substring(0, 16)}...</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Sig R:</span>
                            <span className="text-blue-300">{signatureDetails.r.substring(0, 16)}...</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Sig S:</span>
                            <span className="text-purple-300">{signatureDetails.s.substring(0, 16)}...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-400">
                      Click for full technical details
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Checkmark for sent messages */}
            {isMe && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};