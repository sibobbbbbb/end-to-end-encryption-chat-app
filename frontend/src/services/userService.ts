const BASE_URL = import.meta.env.VITE_API_URL || '/api'; 
const API_URL = `${BASE_URL}/users`;
export interface UserProfile {
  username: string;
  publicKey: string;
}

/**
 * Get user profile (including public key) by username
 */
export const getContactProfile = async (username: string): Promise<UserProfile | null> => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null; // User not found
      }
      throw new Error(`Server Error: ${res.status}`);
    }

    const data = await res.json();
    return data.data || data; // Support both { data: {...} } and direct response
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    // Return null instead of throwing to allow graceful handling
    return null;
  }
};

/**
 * Check if username exists (for contact validation)
 */
export const checkUserExists = async (username: string): Promise<boolean> => {
  try {
    const profile = await getContactProfile(username);
    // If profile exists (even if from fallback), consider user as existing
    // In production, you might want to distinguish between real and fallback
    return profile !== null;
  } catch (error) {
    console.error("Failed to check user existence:", error);
    // For development: allow adding contact even if check fails
    // In production, return false to be more strict
    return false;
  }
};

/**
 * Get list of all users (for contact discovery - optional)
 */
export const getAllUsers = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${API_URL}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      // If endpoint doesn't exist, return empty array
      if (res.status === 404) {
        return [];
      }
      throw new Error(`HTTP ${res.status}: Failed to fetch users`);
    }

    const data = await res.json();
    const users = data.data || data.users || data || [];
    return Array.isArray(users) ? users.map((u: any) => u.username || u) : [];
  } catch (error) {
    console.warn("Failed to fetch users list:", error);
    return [];
  }
};