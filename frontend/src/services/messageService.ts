const API_URL = '/api/messages';

export interface SendMessagePayload {
  sender_username: string;
  receiver_username: string;
  encrypted_message: string;
  message_hash: string;
  signature: {
    r: string;
    s: string;
  };
  timestamp: string;
}

export interface MessageResponse {
  id?: string;
  sender_username: string;
  receiver_username: string;
  encrypted_message: string;
  message_hash: string;
  signature: {
    r: string;
    s: string;
  };
  timestamp: string;
}

/**
 * Send encrypted message to server
 */
export const sendMessage = async (payload: SendMessagePayload): Promise<MessageResponse> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to send message' }));
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to send message`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error: Failed to send message');
  }
};

/**
 * Fetch messages for a conversation partner
 * @param partnerUsername - Username of the conversation partner
 * @param lastMessageId - Optional: ID of last message received (for pagination)
 */
export const fetchMessages = async (
  partnerUsername: string,
  lastMessageId?: string
): Promise<MessageResponse[]> => {
  try {
    const params = new URLSearchParams({ partner: partnerUsername });
    if (lastMessageId) {
      params.append('last_id', lastMessageId);
    }

    const response = await fetch(`${API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch messages' }));
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch messages`);
    }

    const result = await response.json();
    return result.data || result.messages || [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error: Failed to fetch messages');
  }
};

/**
 * Poll for new messages (fallback if WebSocket not available)
 */
export const pollMessages = async (
  partnerUsername: string,
  lastTimestamp?: string
): Promise<MessageResponse[]> => {
  try {
    const params = new URLSearchParams({ partner: partnerUsername });
    if (lastTimestamp) {
      params.append('since', lastTimestamp);
    }

    const response = await fetch(`${API_URL}/poll?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If polling endpoint doesn't exist, return empty array (not critical error)
      if (response.status === 404) {
        return [];
      }
      const errorData = await response.json().catch(() => ({ message: 'Failed to poll messages' }));
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to poll messages`);
    }

    const result = await response.json();
    return result.data || result.messages || [];
  } catch (error) {
    // Polling errors are not critical, return empty array
    console.warn('Polling error:', error);
    return [];
  }
};

