import { useState } from 'react';
import { User, Plus, MessageSquare } from 'lucide-react';

interface ContactSidebarProps {
  onSelectContact: (username: string) => void;
  selectedContact: string | null;
}

export default function ContactSidebar({ onSelectContact, selectedContact }: ContactSidebarProps) {
  // Di real app, daftar ini disimpan di database/local storage
  const [contacts, setContacts] = useState<string[]>(["teman_rahasia", "bos_besar"]); 
  const [newContact, setNewContact] = useState("");

  const handleAddContact = () => {
    if (newContact && !contacts.includes(newContact)) {
      setContacts([...contacts, newContact]);
      setNewContact("");
    }
  };

  return (
    <div className="w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col border-r border-gray-700 shadow-2xl">
      <div className="p-5 font-bold text-lg border-b border-gray-700/50 flex items-center gap-3 bg-gray-800/50">
        <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-lg">
          <MessageSquare size={20} />
        </div>
        <span className="text-white">Contacts</span>
      </div>
      
      {/* List Kontak */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
        {contacts.map(contact => (
          <button
            key={contact}
            onClick={() => onSelectContact(contact)}
            className={`w-full text-left p-4 rounded-xl flex items-center gap-3 transition-all duration-200 ${
              selectedContact === contact 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg scale-105' 
                : 'hover:bg-gray-700/50 hover:scale-102'
            }`}
          >
            <div className={`relative ${selectedContact === contact ? 'animate-pulse' : ''}`}>
              <div className="bg-gradient-to-br from-blue-400 to-purple-400 p-2.5 rounded-full">
                <User size={18} />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{contact}</div>
              <div className="text-xs text-gray-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Online
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Input Tambah Kontak */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-800/30">
        <div className="flex gap-2">
          <input 
            className="flex-1 bg-gray-700/50 text-sm text-white placeholder-gray-400 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Add new contact..."
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddContact()}
          />
          <button 
            onClick={handleAddContact}
            className="bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}