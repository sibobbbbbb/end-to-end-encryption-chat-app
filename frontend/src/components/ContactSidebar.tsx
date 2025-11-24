import { useState, useEffect, useCallback } from "react";
import {
  User,
  Plus,
  MessageSquare,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { clearStoredKey } from "@/lib/keyStorage";
import type { ContactSummary } from "@/services/contactService";
import {
  fetchContacts,
  createContact,
  deleteContact,
  AuthExpiredError,
} from "@/services/contactService";

interface ContactSidebarProps {
  onSelectContact: (username: string | null) => void;
  selectedContact: string | null;
  currentUser: string;
  onAuthError: (message?: string) => void;
}

const buildCacheKey = (username: string) => `chat_contacts_cache_${username}`;

export default function ContactSidebar({
  onSelectContact,
  selectedContact,
  currentUser,
  onAuthError,
}: ContactSidebarProps) {
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [isContactLoading, setIsContactLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [newContact, setNewContact] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  const writeCache = useCallback(
    (username: string, nextContacts: ContactSummary[]) => {
      try {
        localStorage.setItem(
          buildCacheKey(username),
          JSON.stringify(nextContacts)
        );
      } catch (error) {
        console.error("Failed to cache contacts locally:", error);
      }
    },
    []
  );

  const readCache = useCallback((username: string) => {
    try {
      const cached = localStorage.getItem(buildCacheKey(username));
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed as ContactSummary[];
        }
      }
    } catch (error) {
      console.error("Failed to read cached contacts:", error);
    }
    return [];
  }, []);

  const syncContacts = useCallback(
    async (username: string) => {
      setIsSyncing(true);
      setContactsError(null);
      try {
        const serverContacts = await fetchContacts();
        const sorted = [...serverContacts].sort((a, b) =>
          a.username.localeCompare(b.username)
        );
        setContacts(sorted);
        writeCache(username, sorted);
      } catch (error) {
        if (error instanceof AuthExpiredError) {
          onAuthError(error.message);
          return;
        }
        console.error("Failed to fetch contacts from server:", error);
        const cached = readCache(username);
        setContacts(cached);
        setContactsError(
          error instanceof Error ? error.message : "Failed to load contacts"
        );
      } finally {
        setIsContactLoading(false);
        setIsSyncing(false);
      }
    },
    [onAuthError, readCache, writeCache]
  );

  useEffect(() => {
    setContacts(readCache(currentUser));
    setContactsError(null);
    setIsContactLoading(true);
    syncContacts(currentUser);
  }, [currentUser, readCache, syncContacts]);

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
    if (contacts.some((contact) => contact.username === username)) {
      setValidationError("Contact already exists");
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(false);

    try {
      const created = await createContact(username);
      setContacts((prev) => {
        const next = [...prev, created].sort((a, b) =>
          a.username.localeCompare(b.username)
        );
        writeCache(currentUser, next);
        return next;
      });
      setNewContact("");
      setValidationSuccess(true);
      setTimeout(() => {
        setValidationSuccess(false);
      }, 2000);
    } catch (error) {
      if (error instanceof AuthExpiredError) {
        onAuthError(error.message);
        return;
      }
      console.error("Failed to validate contact:", error);
      setValidationError(
        error instanceof Error
          ? error.message
          : "Failed to verify user. Please try again."
      );
      setTimeout(() => setValidationError(null), 5000);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveContact = async (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove ${username} from contacts?`)) {
      try {
        await deleteContact(username);
        setContacts((prev) => {
          const next = prev.filter((c) => c.username !== username);
          writeCache(currentUser, next);
          return next;
        });
        clearStoredKey(username);
        if (selectedContact === username) {
          onSelectContact(null);
        }
      } catch (error) {
        if (error instanceof AuthExpiredError) {
          onAuthError(error.message);
          return;
        }
        console.error("Failed to remove contact:", error);
        setValidationError(
          error instanceof Error ? error.message : "Failed to remove contact"
        );
        setTimeout(() => setValidationError(null), 5000);
      }
    }
  };

  return (
    <div className="w-full sm:w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col border-r border-gray-700 shadow-2xl">
      <div className="p-3 sm:p-5 font-bold text-base sm:text-lg border-b border-gray-700/50 flex items-center gap-2 sm:gap-3 bg-gray-800/50">
        <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-lg">
          <MessageSquare size={20} />
        </div>
        <span className="text-white flex-1">Contacts</span>
        <button
          onClick={() => syncContacts(currentUser)}
          disabled={isSyncing}
          className={`p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Sync contacts"
        >
          <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* List Kontak */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 min-h-0">
        {isContactLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8 animate-pulse">
            <User size={48} className="mb-4 opacity-50" />
            <p className="text-sm font-medium">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
            <User size={48} className="mb-4 opacity-50" />
            <p className="text-sm font-medium">No contacts yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Add a contact to start chatting
            </p>
          </div>
        ) : (
          contacts.map((contact) => (
            <button
              key={contact.username}
              onClick={() => onSelectContact(contact.username)}
              className={`relative group w-full text-left p-3 sm:p-4 rounded-xl flex items-center gap-2 sm:gap-3 transition-all duration-200 cursor-pointer border ${
                selectedContact === contact.username
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg border-transparent"
                  : "bg-gray-700/30 hover:bg-gray-700/50 border-gray-600/30"
              }`}
            >
              <div
                className={`relative flex-shrink-0 ${
                  selectedContact === contact.username ? "animate-pulse" : ""
                }`}
              >
                <div className="bg-gradient-to-br from-blue-400 to-purple-400 p-2.5 rounded-full">
                  <User size={18} />
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ${
                    selectedContact === contact.username
                      ? "border-2 border-white"
                      : "border-2 border-gray-900"
                  }`}
                ></span>
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-semibold truncate ${
                    selectedContact === contact.username
                      ? "text-white"
                      : "text-gray-100"
                  }`}
                >
                  {contact.username}
                </div>
                <div
                  className={`text-xs flex items-center gap-1 ${
                    selectedContact === contact.username
                      ? "text-white/80"
                      : "text-gray-300"
                  }`}
                >
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  Online
                </div>
              </div>
              <button
                onClick={(e) => handleRemoveContact(contact.username, e)}
                className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded-lg cursor-pointer flex-shrink-0 ${
                  selectedContact === contact.username
                    ? "hover:bg-white/10"
                    : ""
                }`}
                title="Remove contact"
              >
                <X
                  size={16}
                  className={
                    selectedContact === contact.username
                      ? "text-white/70 hover:text-red-300"
                      : "text-gray-400 hover:text-red-400"
                  }
                />
              </button>
            </button>
          ))
        )}

        {contactsError && (
          <div className="flex items-center gap-2 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
            <AlertCircle size={14} />
            <span>{contactsError}</span>
          </div>
        )}
      </div>

      {/* Input Tambah Kontak */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-800/30">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                className={`w-full bg-gray-700/50 text-sm text-white placeholder-gray-400 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  validationError
                    ? "focus:ring-red-500 border border-red-500/50"
                    : validationSuccess
                    ? "focus:ring-green-500 border border-green-500/50"
                    : "focus:ring-blue-500"
                }`}
                placeholder="Add new contact..."
                value={newContact}
                onChange={(e) => {
                  setNewContact(e.target.value);
                  setValidationError(null);
                  setValidationSuccess(false);
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" && !isValidating && handleAddContact()
                }
                disabled={isValidating}
              />
              {validationSuccess && (
                <CheckCircle
                  size={16}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400"
                />
              )}
            </div>
            <button
              onClick={handleAddContact}
              disabled={isValidating || !newContact.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer disabled:from-gray-600 disabled:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              title={isValidating ? "Validating..." : "Add contact"}
            >
              {isValidating ? (
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
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
