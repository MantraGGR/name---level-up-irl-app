'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import ChatBot from '../components/ChatBot'
import SpaceTunnel from '../components/SpaceTunnel'

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

interface CalendarEvent {
  id: string
  event_id: string
  title: string
  start_time: string
  end_time: string
  life_pillar_tags: string[]
}

interface ActionStep {
  id: string
  title: string
  description: string
  life_pillar: string
  priority: string
  xp_reward: number
  estimated_duration: number
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
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [actionSteps, setActionSteps] = useState<ActionStep[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    // Check if user just completed onboarding (new user)
    const justOnboarded = sessionStorage.getItem('just_onboarded')
    if (justOnboarded) {
      setIsNewUser(true)
      sessionStorage.removeItem('just_onboarded')
    }

    fetchUserData(token)
  }, [router])

  const fetchUserData = async (token: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/auth/me?token=${token}`)
      setUser(response.data)
      
      const tasksResponse = await axios.get(`http://localhost:8000/tasks/user/${response.data.user_id}`)
      setTasks(tasksResponse.data)

      // Fetch calendar events
      try {
        const eventsResponse = await axios.get(`http://localhost:8000/calendar/events/${response.data.user_id}`)
        setCalendarEvents(eventsResponse.data)
      } catch (e) {
        console.log('No calendar events yet')
      }

      // Fetch AI action steps
      try {
        const stepsResponse = await axios.get(`http://localhost:8000/calendar/action-steps/${response.data.user_id}`)
        setActionSteps(stepsResponse.data)
      } catch (e) {
        console.log('No action steps yet')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      localStorage.removeItem('token')
      router.push('/')
    } finally {
      setLoading(false)
      // Keep intro showing for a bit after data loads for smooth transition
      setTimeout(() => setShowIntro(false), 3000)
    }
  }

  const syncCalendar = async () => {
    if (!user) return
    setSyncing(true)
    try {
      await axios.post(`http://localhost:8000/calendar/sync/${user.user_id}`)
      const eventsResponse = await axios.get(`http://localhost:8000/calendar/events/${user.user_id}`)
      setCalendarEvents(eventsResponse.data)
    } catch (error) {
      console.error('Failed to sync calendar:', error)
    } finally {
      setSyncing(false)
    }
  }

  const generateSteps = async () => {
    if (!user) return
    setGenerating(true)
    try {
      await axios.post(`http://localhost:8000/calendar/generate-steps/${user.user_id}`)
      const stepsResponse = await axios.get(`http://localhost:8000/calendar/action-steps/${user.user_id}`)
      setActionSteps(stepsResponse.data)
    } catch (error) {
      console.error('Failed to generate steps:', error)
    } finally {
      setGenerating(false)
    }
  }

  const completeStep = async (stepId: string) => {
    try {
      const response = await axios.patch(`http://localhost:8000/tasks/${stepId}/complete`)
      setActionSteps(prev => prev.map(s => s.id === stepId ? {...s, completed: true} : s))
      // Update XP display
      if (user && response.data.xp_earned) {
        const pillar = response.data.life_pillar
        setUser({
          ...user,
          total_xp: {
            ...user.total_xp,
            [pillar]: (user.total_xp[pillar] || 0) + response.data.xp_earned
          }
        })
      }
    } catch (error) {
      console.error('Failed to complete step:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  // Show loading state if no user yet
  if (loading && !user) {
    return (
      <SpaceTunnel 
        duration={10000} 
        username=""
        isNewUser={isNewUser}
        onComplete={() => {}} 
      />
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

        {/* Calendar & AI Steps Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Calendar Events */}
          <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-blue-900/30 rounded-lg shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 uppercase tracking-wider">
                📅 Calendar
              </h3>
              <button
                onClick={syncCalendar}
                disabled={syncing}
                className="text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-4 py-2 rounded-lg transition-all uppercase tracking-wider font-bold"
              >
                {syncing ? '⟳ Syncing...' : '⟳ Sync'}
              </button>
            </div>
            {calendarEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📆</div>
                <p className="text-gray-500 text-sm">No upcoming events</p>
                <p className="text-gray-600 text-xs mt-1">Sync your Google Calendar to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {calendarEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="bg-black/50 border border-gray-800 rounded-lg p-3 hover:border-blue-900/50 transition-all">
                    <div className="font-bold text-white text-sm mb-1">{event.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.start_time).toLocaleDateString()} at {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {event.life_pillar_tags.map(tag => (
                        <span key={tag} className="text-xs bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Action Steps */}
          <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-purple-900/30 rounded-lg shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-wider">
                🤖 AI Quests
              </h3>
              <button
                onClick={generateSteps}
                disabled={generating || calendarEvents.length === 0}
                className="text-xs bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 px-4 py-2 rounded-lg transition-all uppercase tracking-wider font-bold"
              >
                {generating ? '⚡ Generating...' : '⚡ Generate'}
              </button>
            </div>
            {actionSteps.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🧠</div>
                <p className="text-gray-500 text-sm">No AI quests yet</p>
                <p className="text-gray-600 text-xs mt-1">Sync calendar then generate AI-powered tasks</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {actionSteps.filter(s => !s.completed).map((step) => (
                  <div key={step.id} className="bg-black/50 border border-gray-800 rounded-lg p-3 hover:border-purple-900/50 transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm mb-1">{step.title}</div>
                        <p className="text-xs text-gray-500 mb-2">{step.description}</p>
                        <div className="flex gap-2 items-center">
                          <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded">
                            {step.life_pillar}
                          </span>
                          <span className="text-xs text-cyan-400 font-bold">+{step.xp_reward} XP</span>
                          <span className="text-xs text-gray-600">~{step.estimated_duration}min</span>
                        </div>
                      </div>
                      <button
                        onClick={() => completeStep(step.id)}
                        className="opacity-0 group-hover:opacity-100 bg-green-600 hover:bg-green-500 text-xs px-3 py-1 rounded transition-all"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* ChatBot */}
      <ChatBot 
        userId={user.user_id} 
        onTaskCreated={() => {
          // Refresh tasks when chatbot creates one
          axios.get(`http://localhost:8000/tasks/user/${user.user_id}`)
            .then(res => setTasks(res.data))
        }}
      />

      {/* Space Tunnel Intro Overlay */}
      {showIntro && (
        <SpaceTunnel 
          duration={4500} 
          username={user.full_name?.split(' ')[0] || ''}
          isNewUser={isNewUser}
          onComplete={() => setShowIntro(false)} 
        />
      )}
    </div>
  )
}
