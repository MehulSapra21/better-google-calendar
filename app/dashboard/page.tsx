"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null)
  
  // Amizone State
  const [hasAmizoneCreds, setHasAmizoneCreds] = useState(false)
  const [amizoneUsername, setAmizoneUsername] = useState('')
  const [amizonePassword, setAmizonePassword] = useState('')
  
  // Scraper State
  const [timetableData, setTimetableData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem('loggedInUser')
    if (!user) {
      router.push('/')
      return
    }
    setLoggedInUser(user)
    checkAmizoneCredentials(user)
  }, [router])

  const checkAmizoneCredentials = async (username: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('amizone_username, amizone_password')
      .eq('username', username)
      .single()

    if (data && data.amizone_username && data.amizone_password) {
      setHasAmizoneCreds(true)
      setAmizoneUsername(data.amizone_username)
      setAmizonePassword(data.amizone_password)
    }
  }

  const saveAmizoneCredentials = async () => {
    if (!amizoneUsername || !amizonePassword) {
      setError("Please fill in both fields.")
      return
    }
    
    setLoading(true)
    setError('')
    
    const { error } = await supabase
      .from('users')
      .update({ 
        amizone_username: amizoneUsername, 
        amizone_password: amizonePassword 
      })
      .eq('username', loggedInUser)

    if (error) {
      setError(error.message)
    } else {
      setHasAmizoneCreds(true)
    }
    setLoading(false)
  }

  const fetchTimetable = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('https://better-google-calendar-backend.onrender.com/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: amizoneUsername,
          password: amizonePassword
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Scraping failed')
      }

      const data = await response.json()
      setTimetableData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser')
    router.push('/')
  }

  if (!loggedInUser) return null 

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome, {loggedInUser}</h1>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Log Out
          </button>
        </div>
        
        {!hasAmizoneCreds ? (
          <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Link Your Amizone Account</h2>
            <p className="mb-4 text-sm text-gray-400">
              Provide your Amizone credentials so we can scrape your timetable.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amizone Username</label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-white"
                  value={amizoneUsername}
                  onChange={(e) => setAmizoneUsername(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Amizone Password</label>
                <input
                  type="password"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-white"
                  value={amizonePassword}
                  onChange={(e) => setAmizonePassword(e.target.value)}
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={saveAmizoneCredentials}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-300">
                Amizone linked as: <span className="font-bold text-blue-400">{amizoneUsername}</span>
              </p>
              <button 
                onClick={() => setHasAmizoneCreds(false)}
                className="text-sm text-gray-400 hover:text-white underline"
              >
                Update Credentials
              </button>
            </div>
            
            <button
              onClick={fetchTimetable}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 py-2 px-6 rounded font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Scraping Amizone (approx 20s)...' : 'Sync Timetable'}
            </button>
            
            {error && (
              <p className="mt-4 text-red-400 bg-red-900/50 p-3 rounded">
                Error: {error}
              </p>
            )}
          </div>
        )}

        {timetableData && (
          <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Scraped Schedule</h2>
              <span className="text-xs font-mono bg-blue-900 text-blue-300 py-1 px-3 rounded-full">
                {timetableData.message}
              </span>
            </div>
            
            {timetableData.data.length === 0 ? (
              <p className="text-gray-400">No classes found.</p>
            ) : (
              <div className="space-y-4">
                {timetableData.data.map((event: any, index: number) => {
                  // Amizone formats titles as: "Subject | Professor | Room"
                  const parts = event.title.split('|').map((s: string) => s.trim())
                  const subject = parts[0] || 'Unknown Subject'
                  const professor = parts[1] || 'Unknown Professor'
                  const room = parts[2] || 'Unknown Room'

                  return (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-600">
                      <div>
                        <h3 className="font-bold text-lg text-blue-400">{subject}</h3>
                        <p className="text-sm text-gray-300">{professor}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-mono font-medium text-white">{event.time}</p>
                        <p className="text-sm text-gray-400">Room: {room}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}