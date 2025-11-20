import React, { useState } from 'react'
import Register from '@/components/Register'
import Login from '@/components/Login'
import Chat from '@/components/Chat'

/**
 * Top level component handling the high‑level application state.  The
 * initial view is the registration form, after which the user is
 * prompted to log in.  On successful login the chat interface is
 * displayed.
 */
function App () {
  const [view, setView] = useState<'register' | 'login' | 'chat'>('register')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      {view === 'register' && (
        <Register onRegistered={() => setView('login')} />
      )}
      {view === 'login' && (
        <Login onLoggedIn={() => setView('chat')} />
      )}
      {view === 'chat' && <Chat />}
    </div>
  )
}

export default App