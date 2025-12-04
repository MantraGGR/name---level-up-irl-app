'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import dynamic from 'next/dynamic'
import SpaceTunnel from '../components/SpaceTunnel'
import ChatBot from '../components/ChatBot'

const Avatar3D = dynamic(() => import('../components/Avatar3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse text-cyan-400">Loading Avatar...</div>
    </div>
  )
})

interface User {
  user_id: string
  email: string
  full_name: string
  display_name?: string
  life_pillar_levels: Record<string, number>
  total_xp: Record<string, number>
}

interface Task {
  id: string
  title: string
  description: string
  life_pillar: string
  priority: string
  xp_reward: number
  completed: boolean
  estimated_duration: number
}

const pillarIcons: Record<string, string> = {
  health: '⚔️',
  career: '🎯',
  relationships: '🤝',
  personal_growth: '📚',
  finance: '💰',
  recreation: '🎮'
}

const LIFE_PILLARS = ['health', 'career', 'relationships', 'personal_growth', 'finance', 'recreation']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showTunnel, setShowTunnel] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  
  // Task creation state
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    life_pillar: 'health',
    priority: 'medium',
    estimated_duration: 30
  })
  const [creating, setCreating] = useState(false)
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [xpAnimation, setXpAnimation] = useState<{ pillar: string; amount: number } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    const justOnboarded = sessionStorage.getItem('just_onboarded')
    if (justOnboarded) {
      setIsNewUser(true)
      setShowTunnel(true)
      sessionStorage.removeItem('just_onboarded')
    } else {
      setShowTunnel(true)
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newTask.title.trim()) return
    
    setCreating(true)
    try {
      const xpReward = Math.round(newTask.estimated_duration / 15) * 10
      const response = await axios.post('http://localhost:8000/tasks/', {
        user_id: user.user_id,
        title: newTask.title,
        description: newTask.description,
        life_pillar: newTask.life_pillar,
        priority: newTask.priority,
        estimated_duration: newTask.estimated_duration,
        xp_reward: xpReward
      })
      
      setTasks(prev => [response.data, ...prev])
      setNewTask({ title: '', description: '', life_pillar: 'health', priority: 'medium', estimated_duration: 30 })
      setShowCreateTask(false)
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTask(taskId)
    try {
      const response = await axios.patch(`http://localhost:8000/tasks/${taskId}/complete`)
      
      // Show XP animation
      setXpAnimation({ pillar: response.data.life_pillar, amount: response.data.xp_earned })
      setTimeout(() => setXpAnimation(null), 2000)
      
      // Update task in list
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t))
      
      // Refresh user data to get updated XP
      const token = localStorage.getItem('token')
      if (token) {
        const userResponse = await axios.get(`http://localhost:8000/auth/me?token=${token}`)
        setUser(userResponse.data)
      }
    } catch (error) {
      console.error('Error completing task:', error)
    } finally {
      setCompletingTask(null)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await axios.delete(`http://localhost:8000/tasks/${taskId}`)
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const handleTunnelComplete = () => {
    setShowTunnel(false)
  }

  if (showTunnel && user) {
    return (
      <SpaceTunnel
        username={user.display_name || user.full_name}
        isNewUser={isNewUser}
        onComplete={handleTunnelComplete}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
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
  
  const incompleteTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>
      
      {/* XP Animation */}
      {xpAnimation && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="text-6xl font-black text-cyan-400 animate-bounce">
            +{xpAnimation.amount} XP
          </div>
          <div className="text-center text-xl text-blue-300 uppercase tracking-wider">
            {xpAnimation.pillar.replace('_', ' ')}
          </div>
        </div>
      )}
      
      <nav className="relative z-10 bg-black/40 backdrop-blur-md border-b border-blue-900/30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 tracking-tight">
              TAKEOFF
            </h1>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-wider">
              Exit System
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Player Card */}
        <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-blue-900/30 rounded-lg shadow-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-48 h-64 bg-black/50 rounded-lg border border-blue-900/50 overflow-hidden">
              <Avatar3D level={avgLevel} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-blue-400 mb-1">Player</div>
                  <h2 className="text-3xl font-black text-white">{user.display_name || user.full_name}</h2>
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
                  <div className="text-xs uppercase tracking-widest text-cyan-300 mb-2">Active Quests</div>
                  <div className="text-3xl font-black text-cyan-400">{incompleteTasks.length}</div>
                  <div className="text-xs text-gray-600 mt-1">Tasks</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Character Stats */}
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
                <div className="text-sm text-gray-500">{(user.total_xp[pillar] || 0).toLocaleString()} XP</div>
                <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${((user.total_xp[pillar] || 0) % 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quest Log */}
        <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-blue-900/30 rounded-lg shadow-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 uppercase tracking-wider">
              Quest Log
            </h3>
            <button
              onClick={() => setShowCreateTask(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold px-4 py-2 rounded-lg text-sm uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-cyan-500/30"
            >
              + New Quest
            </button>
          </div>

          {/* Create Task Modal */}
          {showCreateTask && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-blue-900/50 rounded-xl p-6 w-full max-w-md">
                <h4 className="text-xl font-black text-white mb-4">Create New Quest</h4>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Quest Title</label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                      placeholder="What do you want to accomplish?"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Description</label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 h-20 resize-none"
                      placeholder="Add details..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Life Pillar</label>
                      <select
                        value={newTask.life_pillar}
                        onChange={(e) => setNewTask(prev => ({ ...prev, life_pillar: e.target.value }))}
                        className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                      >
                        {LIFE_PILLARS.map(p => (
                          <option key={p} value={p}>{pillarIcons[p]} {p.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Priority</label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                      >
                        {PRIORITIES.map(p => (
                          <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                      Duration: {newTask.estimated_duration} min ({Math.round(newTask.estimated_duration / 15) * 10} XP)
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="120"
                      step="15"
                      value={newTask.estimated_duration}
                      onChange={(e) => setNewTask(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) }))}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateTask(false)}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !newTask.title.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition-all"
                    >
                      {creating ? 'Creating...' : 'Create Quest'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Task List */}
          {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📜</div>
              <p className="text-gray-500 uppercase tracking-wider text-sm">No active quests</p>
              <p className="text-gray-700 text-xs mt-1">Create a quest to begin your journey</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incompleteTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-black/50 border border-gray-800 hover:border-blue-900/50 rounded-lg p-4 transition-all group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{pillarIcons[task.life_pillar] || '⭐'}</span>
                        <h4 className="font-bold text-white">{task.title}</h4>
                        {task.priority === 'urgent' && (
                          <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">URGENT</span>
                        )}
                        {task.priority === 'high' && (
                          <span className="text-xs bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">HIGH</span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs bg-blue-900/30 text-blue-300 border border-blue-900/50 px-3 py-1 rounded-full uppercase tracking-wider">
                          {task.life_pillar.replace('_', ' ')}
                        </span>
                        <span className="text-xs bg-cyan-900/30 text-cyan-300 border border-cyan-900/50 px-3 py-1 rounded-full font-bold">
                          +{task.xp_reward} XP
                        </span>
                        <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">
                          ~{task.estimated_duration || 30} min
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={completingTask === task.id}
                        className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                      >
                        {completingTask === task.id ? '...' : '✓'}
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 px-3 py-2 rounded-lg text-sm transition-all opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-3">Completed ({completedTasks.length})</h4>
                  <div className="space-y-2">
                    {completedTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="bg-black/30 border border-gray-800 rounded-lg p-3 opacity-50">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span className="text-gray-400 line-through">{task.title}</span>
                          <span className="text-xs text-cyan-400/50">+{task.xp_reward} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <ChatBot />
    </div>
  )
}
