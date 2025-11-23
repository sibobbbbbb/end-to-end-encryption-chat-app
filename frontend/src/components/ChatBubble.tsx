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
        return { color: 'text-green-500', icon: <ShieldCheck size={16} />, label: 'Verified' };
      case 'unverified':
        return { color: 'text-red-500', icon: <ShieldAlert size={16} />, label: 'Unverified' };
      case 'corrupted':
        return { color: 'text-gray-500', icon: <AlertTriangle size={16} />, label: 'Corrupt' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-4`}>
      <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
        {/* Header: Sender Name */}
        {!isMe && <div className="text-xs font-bold mb-1 opacity-70">{sender}</div>}
        
        {/* Message Body */}
        <p className="break-words">{text}</p>
        
        {/* Footer: Timestamp & Security Status */}
        <div className="flex items-center justify-end gap-2 mt-2 pt-1 border-t border-white/10">
          <span className="text-[10px] opacity-70">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
          
          {/* Indikator Keamanan (Hanya perlu dicek untuk pesan masuk/bukan saya) */}
          {!isMe && (
            <div className={`flex items-center gap-1 text-[10px] font-bold ${isMe ? 'text-white' : config.color} bg-black/5 px-1.5 py-0.5 rounded`}>
              {config.icon}
              <span>{config.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};