import { useState } from 'react';
import { registerUser, loginUser } from '@/services/authService';

interface AuthPageProps {
  onLoginSuccess: (username: string) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(""); // State Password
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
        alert("Username dan Password wajib diisi!");
        return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await loginUser(username, password);
        // Tidak perlu alert login berhasil agar UX lebih cepat
      } else {
        await registerUser(username, password);
        alert("Registrasi Berhasil! Silakan login.");
        setIsLogin(true); // Pindah ke mode login setelah register
        setIsLoading(false);
        return; // Jangan langsung login otomatis biar user ingat passwordnya
      }
      
      // Pindah ke halaman utama
      onLoginSuccess(username);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-screen h-screen items-center justify-center bg-gray-900 text-white p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Matrix-style Binary Rain */}
        <div className="absolute inset-0">
          <div className="binary-rain absolute top-0 left-[10%] opacity-20">01010011</div>
          <div className="binary-rain absolute top-0 left-[25%] opacity-15" style={{animationDelay: '0.5s'}}>11001010</div>
          <div className="binary-rain absolute top-0 left-[40%] opacity-20" style={{animationDelay: '1s'}}>10101100</div>
          <div className="binary-rain absolute top-0 left-[55%] opacity-15" style={{animationDelay: '1.5s'}}>01110010</div>
          <div className="binary-rain absolute top-0 left-[70%] opacity-20" style={{animationDelay: '2s'}}>11010110</div>
          <div className="binary-rain absolute top-0 left-[85%] opacity-15" style={{animationDelay: '2.5s'}}>00110101</div>
        </div>

        {/* Hexagonal Grid Pattern */}
        <div className="absolute inset-0 hex-grid opacity-10"></div>
        
        {/* Glowing Orbs with Cyber Effect */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-glow-delay"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl animate-pulse-glow-slow"></div>
        
        {/* Scanning Lines */}
        <div className="absolute inset-0">
          <div className="scan-line bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
          <div className="scan-line-slow bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
        </div>
        
        {/* Lock Icons Floating */}
        <div className="absolute top-[20%] left-[15%] animate-float-icon opacity-30">
          <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="absolute top-[60%] right-[20%] animate-float-icon-delay opacity-30">
          <svg className="w-10 h-10 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="absolute bottom-[25%] left-[25%] animate-float-icon-slow opacity-30">
          <svg className="w-9 h-9 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Circuit Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="circuit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5"/>
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5"/>
            </linearGradient>
          </defs>
          <path className="circuit-path" d="M0,50 Q250,100 500,50 T1000,50" stroke="url(#circuit-gradient)" strokeWidth="2" fill="none"/>
          <path className="circuit-path-delay" d="M0,150 Q250,200 500,150 T1000,150" stroke="url(#circuit-gradient)" strokeWidth="2" fill="none"/>
          <circle className="circuit-dot" cx="250" cy="75" r="4" fill="#3b82f6"/>
          <circle className="circuit-dot-delay" cx="750" cy="125" r="4" fill="#8b5cf6"/>
        </svg>

        {/* Data Particles */}
        <div className="absolute top-[30%] left-[20%] w-1 h-1 bg-blue-400 rounded-full animate-ping-slow"></div>
        <div className="absolute top-[50%] right-[30%] w-1 h-1 bg-purple-400 rounded-full animate-ping-slow" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-[35%] left-[40%] w-1 h-1 bg-cyan-400 rounded-full animate-ping-slow" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-[70%] right-[15%] w-1 h-1 bg-blue-300 rounded-full animate-ping-slow" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      <div className="w-full max-w-md rounded-2xl bg-gray-800/95 backdrop-blur-xl p-8 shadow-2xl relative z-10 border border-cyan-500/30 animate-fade-in-up">
        {/* Glowing Border Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 blur-xl -z-10 animate-glow-pulse"></div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {isLogin ? "Welcome Back!" : "Create Account"}
          </h2>
          <p className="text-gray-400 text-sm">
            {isLogin ? "Secure end-to-end encrypted messaging" : "Join the most secure chat platform"}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">Username</label>
            <input
              type="text"
              required
              className="block w-full rounded-xl border-2 border-gray-600 bg-gray-700 text-white px-4 py-3 focus:border-blue-500 focus:bg-gray-600 focus:outline-none transition-all placeholder-gray-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">Password</label>
            <input
              type="password"
              required
              className="block w-full rounded-xl border-2 border-gray-600 bg-gray-700 text-white px-4 py-3 focus:border-blue-500 focus:bg-gray-600 focus:outline-none transition-all placeholder-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <p className="text-xs text-gray-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Used to generate your encryption keys. Don't forget it!
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3.5 text-white font-bold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (isLogin ? "Sign In" : "Create Account")}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-700 pt-6">
          <p className="text-gray-400 text-sm mb-2">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={() => {
                setIsLogin(!isLogin);
                setUsername("");
                setPassword("");
            }}
            className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            {isLogin ? "Sign up for free →" : "← Back to sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}