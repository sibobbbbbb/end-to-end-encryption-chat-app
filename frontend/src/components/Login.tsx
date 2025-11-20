import React, { useState } from 'react'
import {
  derivePrivateKeyFromPassword,
  signMessage,
  hashMessage,
} from '@/lib/crypto'

interface LoginProps {
  /** Callback invoked when login succeeds; yields the access token */
  onLoggedIn: (token: string) => void
}

/**
 * Login form implementing the challenge–response protocol described in
 * the assignment.  The user provides their username and password.
 * The password deterministically regenerates their private key.  A
 * login challenge is requested from the backend; the nonce is
 * signed using the regenerated private key and posted back for
 * verification.  On success the returned access token is persisted
 * locally and passed to the parent via `onLoggedIn`.
 */
const Login: React.FC<LoginProps> = ({ onLoggedIn }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Derive private key from password again (key never stored on server)
      const privateKey = derivePrivateKeyFromPassword(password)
      localStorage.setItem('username', username)
      localStorage.setItem('privateKey', privateKey)
      // Determine base URL for API; default to local backend
      const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
      // Request a nonce/challenge from the server
      const challengeRes = await fetch(`${API}/api/auth/login/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      if (!challengeRes.ok) {
        let msg = 'Failed to obtain login challenge'
        try {
          const data = await challengeRes.json()
          msg = data.message || msg
        } catch {}
        throw new Error(msg)
      }
      const { nonce } = await challengeRes.json()
      // Sign the nonce (hash) with our private key
      // Hash the nonce before signing; elliptic expects a hex string or BN
      const nonceHash = hashMessage(nonce)
      const signature = signMessage(privateKey, nonceHash)
      // Send signature back for verification
      const verifyRes = await fetch(`${API}/api/auth/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, signature }),
      })
      if (!verifyRes.ok) {
        let msg = 'Login failed'
        try {
          const data = await verifyRes.json()
          msg = data.message || msg
        } catch {}
        throw new Error(msg)
      }
      const { accessToken } = await verifyRes.json()
      localStorage.setItem('accessToken', accessToken)
      onLoggedIn(accessToken)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className="flex flex-col gap-4 p-4 border rounded-lg shadow max-w-sm w-full"
    >
      <h2 className="text-lg font-semibold text-center">Login</h2>
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
        className="bg-green-600 text-white p-2 rounded disabled:opacity-50"
      >
        {loading ? 'Logging in…' : 'Login'}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  )
}

export default Login