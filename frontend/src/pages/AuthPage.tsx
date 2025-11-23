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
    <div className="flex w-screen h-screen items-center justify-center bg-gray-100 text-black p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          {isLogin ? "Login SecureChat" : "Buat Akun Baru"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-black p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username..."
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-black p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password rahasia..."
            />
            <p className="mt-1 text-[10px] text-gray-500">
                Password digunakan untuk menghasilkan kunci enkripsi Anda. Jangan sampai lupa!
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 py-2 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {isLoading ? "Memproses..." : (isLogin ? "Masuk" : "Daftar")}
          </button>
        </form>

        <div className="mt-6 text-center border-t pt-4">
          <button
            onClick={() => {
                setIsLogin(!isLogin);
                setUsername("");
                setPassword("");
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            {isLogin ? "Belum punya akun? Daftar sekarang" : "Sudah punya akun? Login di sini"}
          </button>
        </div>
      </div>
    </div>
  );
}