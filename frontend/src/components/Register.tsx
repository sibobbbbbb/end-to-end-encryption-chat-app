import React, { useState } from 'react'
import { generateKeyPairFromPassword } from '@/lib/crypto'

interface RegisterProps {
  /**
   * Callback invoked when registration completes successfully.  The
   * parent component can switch views on success.
   */
  onRegistered: () => void
}

/**
 * Simple registration form.  Users choose a username and password.
 * On submission an ECC key pair is deterministically generated from
 * the password.  The public key and username are posted to the
 * server's `/auth/register` endpoint.  The private key is never
 * transmitted; instead it is persisted in `localStorage` for later
 * use.  Any errors returned by the server are displayed to the
 * user.
 */
const Register: React.FC<RegisterProps> = ({ onRegistered }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Generate deterministic key pair from password
      const { privateKey, publicKey } = generateKeyPairFromPassword(password)
      // Persist keys and username locally.  The public key is stored
      // for convenience when sending messages to others.
      localStorage.setItem('username', username)
      localStorage.setItem('privateKey', privateKey)
      localStorage.setItem('publicKey', publicKey)
      // Determine base URL for API; default to local backend
      const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
      // Post ECC registration request to backend.  The backend expects
      // registration of ECC users at /api/auth/register-ecc.
      const res = await fetch(`${API}/api/auth/register-ecc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, publicKey }),
      })
      if (!res.ok) {
        let msg = 'Registration failed'
        try {
          const data = await res.json()
          msg = data.message || msg
        } catch {}
        throw new Error(msg)
      }
      onRegistered()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleRegister}
      className="flex flex-col gap-4 p-4 border rounded-lg shadow max-w-sm w-full"
    >
      <h2 className="text-lg font-semibold text-center">Register</h2>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
        className="p-2 border rounded"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        className="p-2 border rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white p-2 rounded disabled:opacity-50"
      >
        {loading ? 'Registering…' : 'Register'}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  )
}

export default Register