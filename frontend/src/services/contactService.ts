const BASE_URL = import.meta.env.VITE_API_URL || "/api";
const API_URL = `${BASE_URL}/contacts`;

export interface ContactSummary {
  username: string;
  publicKey: string;
  addedAt?: string;
}

const buildHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token missing. Please log in again.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const parseResponse = async (res: Response) => {
  const payload = await res
    .json()
    .catch(() => ({ message: "Unable to parse server response" }));

  if (!res.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload.data ?? payload;
};

export const fetchContacts = async (): Promise<ContactSummary[]> => {
  const res = await fetch(API_URL, {
    method: "GET",
    headers: buildHeaders(),
  });

  return await parseResponse(res);
};

export const createContact = async (
  username: string
): Promise<ContactSummary> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ username }),
  });

  return await parseResponse(res);
};

export const deleteContact = async (username: string): Promise<void> => {
  const res = await fetch(`${API_URL}/${encodeURIComponent(username)}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  await parseResponse(res);
};
