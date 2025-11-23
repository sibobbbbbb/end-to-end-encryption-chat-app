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
    <div className="flex flex-col w-screen h-screen bg-white text-black overflow-hidden">
      {/* Header Global */}
      <header className="flex justify-between items-center bg-gray-900 text-white p-3 px-6 shadow-md z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">SecureChat</h1>
            <p className="text-[10px] text-gray-400">E2E Encrypted & Signed</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <div className="text-sm font-medium">{currentUser}</div>
                <div className="text-[10px] text-green-400">● Online</div>
            </div>
            <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md transition-colors"
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
        />

        {/* Chat Area */}
        <main className="flex-1 relative bg-gray-100">
          {selectedContact ? (
            <ChatPage 
              currentUser={currentUser} 
              contactUsername={selectedContact} 
            />
          ) : (
            // Placeholder State (Belum pilih kontak)
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                <MessageSquare size={48} className="text-blue-200" />
              </div>
              <h2 className="text-xl font-semibold text-gray-600">Selamat Datang, {currentUser}!</h2>
              <p className="text-sm mt-2 max-w-xs text-center">
                Pilih salah satu teman dari sidebar di sebelah kiri untuk memulai percakapan aman.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;