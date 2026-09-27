"use client"

import { useState } from 'react'
import { supabase } from '../utils/supabase'

export default function AuthPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSignup = async () => {
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, password }])

    if (error) {
      setMessage(`Signup failed: ${error.message}`)
    } else {
      setMessage('Signup successful! You can now log in.')
    }
  }

  const handleLogin = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single()

    if (error || !data) {
      setMessage('Login failed: Invalid username or password.')
    } else {
      setMessage(`Welcome back, ${data.username}!`)
      // Later, we will redirect to the dashboard here
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Phase 2: Authentication</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password (Plain Text)</label>
            <input
              type="password"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {message && (
            <div className="text-sm text-center p-2 bg-gray-700 rounded text-blue-300">
              {message}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleLogin}
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded font-medium transition-colors"
            >
              Log In
            </button>
            <button
              onClick={handleSignup}
              className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded font-medium transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}