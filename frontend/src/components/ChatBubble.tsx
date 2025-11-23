import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react'; // Pastikan install lucide-react

interface ChatBubbleProps {
  text: string;
  sender: string;
  isMe: boolean;
  status: 'verified' | 'unverified' | 'corrupted';
  timestamp: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ text, sender, isMe, status, timestamp }) => {
  // Warna dan Icon berdasarkan status keamanan
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: <ShieldCheck size={14} />, label: 'Verified' };
      case 'unverified':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: <ShieldAlert size={14} />, label: 'Unverified' };
      case 'corrupted':
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: <AlertTriangle size={14} />, label: 'Corrupt' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300 w-full px-2`}>
      <div 
        className={`max-w-[70%] min-w-[120px] rounded-2xl px-4 py-3 shadow-md ${ 
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
        <div className={`flex items-center gap-2 mt-2 pt-2 ${isMe ? 'border-t border-white/20' : 'border-t border-gray-600'}`}>
          <span className={`text-[11px] font-medium ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
            {new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          
          {/* Indikator Keamanan (Hanya untuk pesan masuk) */}
          {!isMe && (
            <div className={`flex items-center gap-1 text-[10px] font-semibold ${config.color} ${config.bgColor} px-2 py-0.5 rounded-full`}>
              {config.icon}
              <span>{config.label}</span>
            </div>
          )}
          
          {/* Checkmark untuk pesan terkirim (Hanya untuk pesan saya) */}
          {isMe && (
            <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};