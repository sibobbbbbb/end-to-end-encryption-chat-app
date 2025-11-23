import { useState, useEffect } from 'react';
import { User, Plus, MessageSquare, X, AlertCircle, CheckCircle } from 'lucide-react';
import { checkUserExists } from '@/services/userService';

interface ContactSidebarProps {
  onSelectContact: (username: string) => void;
  selectedContact: string | null;
  currentUser: string;
}

const CONTACTS_STORAGE_KEY = 'chat_contacts';

export default function ContactSidebar({ onSelectContact, selectedContact, currentUser }: ContactSidebarProps) {
  const [contacts, setContacts] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error("Failed to load contacts from storage:", error);
    }
    return [];
  });

  const [newContact, setNewContact] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Save contacts to localStorage whenever contacts change
  useEffect(() => {
    try {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
    } catch (error) {
      console.error("Failed to save contacts to storage:", error);
    }
  }, [contacts]);

  const handleAddContact = async () => {
    const username = newContact.trim();
    
    if (!username) {
      setValidationError("Please enter a username");
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    // Validate username format (basic validation)
    if (username.length < 3) {
      setValidationError("Username must be at least 3 characters");
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    if (username === currentUser) {
      setValidationError("You cannot add yourself as a contact");
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    // Check for duplicates
    if (contacts.includes(username)) {
      setValidationError("Contact already exists");
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(false);

    try {
      // Check if user exists
      const exists = await checkUserExists(username);
      
      if (exists) {
        setContacts(prev => [...prev, username]);
        setNewContact("");
        setValidationSuccess(true);
        setTimeout(() => {
          setValidationSuccess(false);
        }, 2000);
      } else {
        setValidationError("User not found. Please check the username.");
        setTimeout(() => setValidationError(null), 5000);
      }
    } catch (error) {
      console.error("Failed to validate contact:", error);
      setValidationError("Failed to verify user. Please try again.");
      setTimeout(() => setValidationError(null), 5000);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveContact = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove ${username} from contacts?`)) {
      setContacts(prev => prev.filter(c => c !== username));
      localStorage.removeItem(`pubkey_${username}`);
    }
  };

  return (
    <div className="w-full sm:w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col border-r border-gray-700 shadow-2xl">
      <div className="p-3 sm:p-5 font-bold text-base sm:text-lg border-b border-gray-700/50 flex items-center gap-2 sm:gap-3 bg-gray-800/50">
        <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-lg">
          <MessageSquare size={20} />
        </div>
        <span className="text-white">Contacts</span>
      </div>
      
      {/* List Kontak */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 min-h-0">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
            <User size={48} className="mb-4 opacity-50" />
            <p className="text-sm font-medium">No contacts yet</p>
            <p className="text-xs text-gray-600 mt-1">Add a contact to start chatting</p>
          </div>
        ) : (
          contacts.map(contact => (
            <button
              key={contact}
              onClick={() => onSelectContact(contact)}
              className={`relative group w-full text-left p-3 sm:p-4 rounded-xl flex items-center gap-2 sm:gap-3 transition-all duration-200 cursor-pointer border ${
                selectedContact === contact 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg border-transparent' 
                  : 'bg-gray-700/30 hover:bg-gray-700/50 border-gray-600/30'
              }`}
            >
              <div className={`relative flex-shrink-0 ${selectedContact === contact ? 'animate-pulse' : ''}`}>
                <div className="bg-gradient-to-br from-blue-400 to-purple-400 p-2.5 rounded-full">
                  <User size={18} />
                </div>
                <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ${
                  selectedContact === contact ? 'border-2 border-white' : 'border-2 border-gray-900'
                }`}></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold truncate ${
                  selectedContact === contact ? 'text-white' : 'text-gray-100'
                }`}>{contact}</div>
                <div className={`text-xs flex items-center gap-1 ${
                  selectedContact === contact ? 'text-white/80' : 'text-gray-300'
                }`}>
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  Online
                </div>
              </div>
              <button
                onClick={(e) => handleRemoveContact(contact, e)}
                className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded-lg cursor-pointer flex-shrink-0 ${
                  selectedContact === contact ? 'hover:bg-white/10' : ''
                }`}
                title="Remove contact"
              >
                <X size={16} className={selectedContact === contact ? 'text-white/70 hover:text-red-300' : 'text-gray-400 hover:text-red-400'} />
              </button>
            </button>
          ))
        )}
      </div>

      {/* Input Tambah Kontak */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-800/30">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input 
                className={`w-full bg-gray-700/50 text-sm text-white placeholder-gray-400 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  validationError ? 'focus:ring-red-500 border border-red-500/50' : 
                  validationSuccess ? 'focus:ring-green-500 border border-green-500/50' : 
                  'focus:ring-blue-500'
                }`}
                placeholder="Add new contact..."
                value={newContact}
                onChange={(e) => {
                  setNewContact(e.target.value);
                  setValidationError(null);
                  setValidationSuccess(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && !isValidating && handleAddContact()}
                disabled={isValidating}
              />
              {validationSuccess && (
                <CheckCircle size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400" />
              )}
            </div>
            <button 
              onClick={handleAddContact}
              disabled={isValidating || !newContact.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer disabled:from-gray-600 disabled:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              title={isValidating ? "Validating..." : "Add contact"}
            >
              {isValidating ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Plus size={20} />
              )}
            </button>
          </div>
          {validationError && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertCircle size={14} />
              <span>{validationError}</span>
            </div>
          )}
          {validationSuccess && (
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
              <CheckCircle size={14} />
              <span>Contact added successfully!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}