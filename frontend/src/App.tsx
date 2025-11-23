import { useState, useEffect } from 'react';
import { MessageSquare, LogOut } from 'lucide-react';
import AuthPage from '@/pages/AuthPage';
import ChatPage from '@/pages/ChatPage';
import ContactSidebar from '@/components/ContactSidebar'; // Pastikan komponen ini sudah dibuat

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  // Cek sesi local storage saat load
  useEffect(() => {
    const checkSession = () => {
      const savedUser = localStorage.getItem('last_user');
      if (savedUser) {
        // Validasi sederhana: Cek apakah private key masih ada
        const hasKey = localStorage.getItem(`priv_${savedUser}`);
        if (hasKey) {
          setCurrentUser(savedUser);
        } else {
          localStorage.removeItem('last_user'); // Bersihkan jika data korup
        }
      }
      setIsLoading(false);
    };
    
    checkSession();
  }, []);

  const handleLoginSuccess = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem('last_user', username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedContact(null);
    localStorage.removeItem('last_user');
    localStorage.removeItem('token');
  };

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-blue-600 font-bold animate-pulse">Memuat Aplikasi...</div>
        </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header Global */}
      <header className="flex justify-between items-center bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white p-4 px-6 shadow-2xl z-20 shrink-0 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl shadow-lg">
            <MessageSquare size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight">SecureChat</h1>
            <p className="text-xs text-white/80 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              End-to-End Encrypted
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold">{currentUser}</div>
                <div className="text-xs text-green-300 flex items-center justify-end gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </div>
            </div>
            <button 
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2.5 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
            title="Logout"
            >
            <LogOut size={18} />
            </button>
        </div>
      </header>
      
      {/* Main Layout: Sidebar (Kiri) + Chat (Kanan) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ContactSidebar 
          selectedContact={selectedContact} 
          onSelectContact={setSelectedContact}
          currentUser={currentUser}
        />

        {/* Chat Area */}
        <main className="flex-1 relative bg-gradient-to-br from-gray-800 to-gray-900">
          {selectedContact ? (
            <ChatPage 
              currentUser={currentUser} 
              contactUsername={selectedContact} 
            />
          ) : (
            // Placeholder State (Belum pilih kontak)
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 rounded-3xl shadow-2xl mb-6 animate-pulse border border-gray-700">
                <MessageSquare size={64} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-200 mb-2">Welcome, {currentUser}! 👋</h2>
              <p className="text-sm max-w-md text-center text-gray-400 leading-relaxed">
                Select a contact from the sidebar to start a secure,<br />
                end-to-end encrypted conversation.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;