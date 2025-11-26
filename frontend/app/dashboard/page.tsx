'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface User {
  user_id: string
  email: string
  full_name: string
  life_pillar_levels: Record<string, number>
  total_xp: Record<string, number>
}

interface Task {
  id: string
  title: string
  description: string
  life_pillar: string
  xp_reward: number
  completed: boolean
}

const pillarIcons: Record<string, string> = {
  health: '⚔️',
  career: '🎯',
  relationships: '🤝',
  personal_growth: '📚',
  finance: '💰',
  recreation: '🎮'
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    fetchUserData(token)
  }, [router])

  const fetchUserData = async (token: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/auth/me?token=${token}`)
      setUser(response.data)
      
      const tasksResponse = await axios.get(`http://localhost:8000/tasks/user/${response.data.user_id}`)
      setTasks(tasksResponse.data)
    } catch (error) {
      console.error('Error fetching user data:', error)
      localStorage.removeItem('token')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400 mb-4"></div>
          <div className="text-xl text-gray-400">Loading System...</div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const totalXP = Object.values(user.total_xp).reduce((a, b) => a + b, 0)
  const avgLevel = Math.round(
    Object.values(user.life_pillar_levels).reduce((a, b) => a + b, 0) / 
    Object.keys(user.life_pillar_levels).length
  )

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 bg-black/40 backdrop-blur-md border-b border-blue-900/30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 tracking-tight">
              TAKEOFF
            </h1>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-wider"
            >
              Exit System
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Player Card */}
        <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-blue-900/30 rounded-lg shadow-2xl p-6 mb-8 glow-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-400 mb-1">Player</div>
              <h2 className="text-3xl font-black text-white">{user.full_name}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-cyan-400 mb-1">Rank</div>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                {avgLevel}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-black/50 border border-blue-900/50 p-4 rounded-lg">
              <div className="text-xs uppercase tracking-widest text-blue-300 mb-2">Total Experience</div>
              <div className="text-3xl font-black text-blue-400">{totalXP.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">XP</div>
            </div>
            <div className="bg-black/50 border border-cyan-900/50 p-4 rounded-lg">
              <div className="text-xs uppercase tracking-widest text-cyan-300 mb-2">Average Level</div>
              <div className="text-3xl font-black text-cyan-400">{avgLevel}</div>
              <div className="text-xs text-gray-600 mt-1">Across all stats</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-blue-900/30 rounded-lg shadow-2xl p-6 mb-8">
          <h3 className="text-xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 uppercase tracking-wider">
            Character Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(user.life_pillar_levels).map(([pillar, level]) => (
              <div key={pillar} className="bg-black/50 border border-gray-800 rounded-lg p-4 hover:border-blue-900/50 transition-all group">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{pillarIcons[pillar] || '⭐'}</span>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-blue-400 transition-colors">
                    {pillar.replace('_', ' ')}
                  </div>
                </div>
                <div className="text-3xl font-black text-white mb-1">LVL {level}</div>
                <div className="text-sm text-gray-500">
                  {user.total_xp[pillar].toLocaleString()} XP
                </div>
                {/* XP Bar */}
                <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    style={{ width: `${(user.total_xp[pillar] % 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quest Log */}
        <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-blue-900/30 rounded-lg shadow-2xl p-6">
          <h3 className="text-xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 uppercase tracking-wider">
            Quest Log
          </h3>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-600 mb-2">📜</div>
              <p className="text-gray-500 uppercase tracking-wider text-sm">No active quests</p>
              <p className="text-gray-700 text-xs mt-1">Begin your journey by accepting a quest</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`border rounded-lg p-4 transition-all ${
                    task.completed 
                      ? 'bg-black/30 border-gray-800 opacity-50' 
                      : 'bg-black/50 border-gray-800 hover:border-blue-900/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-white">{task.title}</h4>
                        {task.completed && (
                          <span className="text-green-400 text-sm">✓ Complete</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-blue-900/30 text-blue-300 border border-blue-900/50 px-3 py-1 rounded-full uppercase tracking-wider">
                          {task.life_pillar}
                        </span>
                        <span className="text-xs bg-cyan-900/30 text-cyan-300 border border-cyan-900/50 px-3 py-1 rounded-full font-bold">
                          +{task.xp_reward} XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
