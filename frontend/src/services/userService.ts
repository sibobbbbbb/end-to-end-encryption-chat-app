// const API_URL = '/api/users'; // Will be used when backend is ready

export interface UserProfile {
  username: string;
  publicKey: string;
}

// Minta teman Backend Anda membuat endpoint ini: GET /api/users/:username
export const getContactProfile = async (username: string): Promise<UserProfile | null> => {
  try {
    // TODO: Uncomment baris di bawah jika Backend sudah siap
    // const res = await fetch(`${API_URL}/${username}`);
    // if (!res.ok) return null;
    // const data = await res.json();
    // return data.data; // Asumsi format response standard

    // --- MOCK DATA (Sementara Backend Belum Siap) ---
    // Ini simulasi seolah-olah server mengembalikan Public Key teman
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          username: username,
          // Public key dummy (ganti dengan hex valid untuk tes dekripsi nyata)
          publicKey: "047e634d4..." 
        });
      }, 500);
    });
  } catch (error) {
    console.error("Gagal mengambil profil user:", error);
    return null;
  }
};