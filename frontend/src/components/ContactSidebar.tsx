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
    <div className="w-64 bg-gray-900 text-white flex flex-col border-r border-gray-700">
      <div className="p-4 font-bold text-lg border-b border-gray-700 flex items-center gap-2">
        <MessageSquare size={20} /> Daftar Kontak
      </div>
      
      {/* List Kontak */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {contacts.map(contact => (
          <button
            key={contact}
            onClick={() => onSelectContact(contact)}
            className={`w-full text-left p-3 rounded flex items-center gap-3 hover:bg-gray-800 transition-colors ${
              selectedContact === contact ? 'bg-blue-600 hover:bg-blue-700' : ''
            }`}
          >
            <div className="bg-gray-700 p-1.5 rounded-full">
              <User size={16} />
            </div>
            <span>{contact}</span>
          </button>
        ))}
      </div>

      {/* Input Tambah Kontak */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-1">
          <input 
            className="w-full bg-gray-800 text-sm p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Username..."
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
          />
          <button 
            onClick={handleAddContact}
            className="bg-blue-600 p-2 rounded hover:bg-blue-700"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}