const BASE_URL = import.meta.env.VITE_API_URL || "/api";
const API_URL = `${BASE_URL}/users`;

export interface UserProfile {
  username: string;
  publicKey: string;
}

/**
 * Get user profile by username
 */
export const getContactProfile = async (
  username: string
): Promise<UserProfile | null> => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/${username}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`HTTP ${res.status}: Failed to fetch user profile`);
    }

    const data = await res.json();
    return data.data || data;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
};

/**
 * Check if username exists (for contact validation)
 */
export const checkUserExists = async (username: string): Promise<boolean> => {
  try {
    const profile = await getContactProfile(username);
    return profile !== null;
  } catch (error) {
    console.error("Failed to check user existence:", error);
    return false;
  }
};

/**
 * Get list of all users (for contact discovery - optional)
 */
export const getAllUsers = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${API_URL}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return [];
      }
      throw new Error(`HTTP ${res.status}: Failed to fetch users`);
    }

    const data = await res.json();
    const users = data.data || data.users || data || [];
    return Array.isArray(users)
      ? users
          .map((u: { username?: string } | string) =>
            typeof u === "string" ? u : u.username || ""
          )
          .filter(Boolean)
      : [];
  } catch (error) {
    console.warn("Failed to fetch users list:", error);
    return [];
  }
};
