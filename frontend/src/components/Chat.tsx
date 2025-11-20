import React, { useState } from 'react'
import {
  hashMessage,
  signMessage,
  encryptMessage,
  decryptMessage,
} from '@/lib/crypto'

interface ChatMessage {
  id: number
  sender: string
  receiver: string
  ciphertext: string
  timestamp: string
  // Additional fields such as signature, hash can be added for
  // debugging/display if required.
}

/**
 * A very simple chat interface.  Users specify a recipient username
 * and public key (this would normally be retrieved from the server).
 * Messages are encrypted and signed client‑side before being posted
 * to `/messages`.  Received messages are decrypted for display.
 *
 * This component does not implement real‑time updates or contact
 * lists.  It is a minimal proof of concept showing how the
 * cryptographic primitives tie together.
 */
const Chat: React.FC = () => {
  const [recipient, setRecipient] = useState('')
  const [recipientPubKey, setRecipientPubKey] = useState('')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const username = localStorage.getItem('username') || ''
  const privateKey = localStorage.getItem('privateKey') || ''
  const publicKey = localStorage.getItem('publicKey') || ''
  const accessToken = localStorage.getItem('accessToken') || ''

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipient || !recipientPubKey || !message) return
    // Hash and sign the plaintext message
    const msgHash = hashMessage(message)
    const signature = signMessage(privateKey, msgHash)
    // Encrypt the message for the recipient
    const cipher = encryptMessage(privateKey, recipientPubKey, message)
    const timestamp = new Date().toISOString()
    // Construct payload expected by the backend
    const payload = {
      receiverUsername: recipient,
      encryptedMessage: cipher,
      messageHash: msgHash,
      signature,
      timestamp,
    }
    try {
      const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
      await fetch(`${API}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })
    } catch {
      // ignore network errors for this demo
    }
    // Append to local history so the sender can see the message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: username,
        receiver: recipient,
        ciphertext: cipher,
        timestamp,
      },
    ])
    setMessage('')
  }

  // Helper to decrypt a ciphertext using local private key and
  // recipient public key.  In a real application the appropriate
  // public key (sender or recipient) would be used depending on
  // message direction.  Here we simply assume that the same
  // recipientPubKey applies in both directions for demonstration.
  const decrypt = (cipher: string) => {
    try {
      return decryptMessage(privateKey, recipientPubKey, cipher)
    } catch {
      return '[unable to decrypt]'
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg shadow max-w-lg w-full">
      <h2 className="text-lg font-semibold text-center">Chat</h2>
      <div className="flex gap-2">
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Recipient username"
          className="flex-1 p-2 border rounded"
        />
        <input
          value={recipientPubKey}
          onChange={(e) => setRecipientPubKey(e.target.value)}
          placeholder="Recipient public key"
          className="flex-1 p-2 border rounded"
        />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-1 p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white p-2 rounded"
        >
          Send
        </button>
      </form>
      <div className="overflow-y-auto max-h-80">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2 p-2 border rounded">
            <p className="text-sm mb-1">
              <strong>{msg.sender}</strong> → {msg.receiver}{' '}
              <span className="text-gray-500">
                {new Date(msg.timestamp).toLocaleString()}
              </span>
            </p>
            <p className="break-words">
              {decrypt(msg.ciphertext)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Chat