'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import QuestBoard from '../components/QuestBoard'
import UltimateGoals from '../components/UltimateGoals'
import { api } from '../../lib/api'

interface User {
  user_id: string
  email: string
  full_name: string
  life_pillar_levels: Record<string, number>
  total_xp: Record<string, number>
}

type TabType = 'daily' | 'achievement' | 'ultimate'

export default function QuestsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('daily')
  const [xpAnimation, setXpAnimation] = useState<{ pillar: string; amount: number } | null>(null)

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
      const response = await axios.get(api.auth.me(token))
      setUser(response.data)
    } catch (error) {
      console.error('Error fetching user:', error)
      localStorage.removeItem('token')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleXpGained = (pillar: string, amount: number) => {
    setXpAnimation({ pillar, amount })
    setTimeout(() => setXpAnimation(null), 2000)
    const token = localStorage.getItem('token')
    if (token) fetchUserData(token)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  const totalXP = Object.values(user.total_xp).reduce((a, b) => a + b, 0)


  return (
    <div className="min-h-screen bg-black">
      {/* XP Animation */}
      {xpAnimation && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="text-6xl font-black text-cyan-400 animate-bounce">
            +{xpAnimation.amount} XP
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="bg-black/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                ← Back
              </Link>
              <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                QUEST HUB
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-500">Total XP:</span>
                <span className="text-cyan-400 font-bold ml-2">{totalXP.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2 bg-gray-900/50 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'daily'
                ? 'bg-cyan-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            📋 Daily Tasks
          </button>
          <button
            onClick={() => setActiveTab('achievement')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'achievement'
                ? 'bg-yellow-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            🏆 Achievement Quests
          </button>
          <button
            onClick={() => setActiveTab('ultimate')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'ultimate'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            👑 Ultimate Goals
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'daily' && (
          <DailyTasksSection userId={user.user_id} onXpGained={handleXpGained} />
        )}
        
        {activeTab === 'achievement' && (
          <QuestBoard userId={user.user_id} onXpGained={handleXpGained} />
        )}
        
        {activeTab === 'ultimate' && (
          <UltimateGoals userId={user.user_id} onXpGained={handleXpGained} />
        )}
      </main>
    </div>
  )
}


// Daily Tasks Section Component
function DailyTasksSection({ userId, onXpGained }: { userId: string; onXpGained: (pillar: string, xp: number) => void }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    life_pillar: 'health',
    priority: 'medium',
    estimated_duration: 30
  })
  const [creating, setCreating] = useState(false)

  const pillarIcons: Record<string, string> = {
    health: '💪', career: '🎯', relationships: '🤝',
    personal_growth: '📚', finance: '💰', recreation: '🎮'
  }
  const LIFE_PILLARS = ['health', 'career', 'relationships', 'personal_growth', 'finance', 'recreation']
  const PRIORITIES = ['low', 'medium', 'high', 'urgent']

  useEffect(() => {
    fetchTasks()
  }, [userId])

  const fetchTasks = async () => {
    try {
      const response = await axios.get(api.tasks.list(userId))
      setTasks(response.data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    setCreating(true)
    try {
      const xpReward = Math.round(newTask.estimated_duration / 15) * 10
      await axios.post(api.tasks.create(), {
        user_id: userId,
        title: newTask.title,
        description: newTask.description,
        life_pillar: newTask.life_pillar,
        priority: newTask.priority,
        estimated_duration: newTask.estimated_duration,
        xp_reward: xpReward
      })
      await fetchTasks()
      setShowCreateModal(false)
      setNewTask({ title: '', description: '', life_pillar: 'health', priority: 'medium', estimated_duration: 30 })
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setCreating(false)
    }
  }

  const completeTask = async (taskId: string) => {
    setCompletingTask(taskId)
    try {
      const response = await axios.patch(api.tasks.complete(taskId))
      onXpGained(response.data.life_pillar, response.data.xp_earned)
      await fetchTasks()
    } catch (error) {
      console.error('Error completing task:', error)
    } finally {
      setCompletingTask(null)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      await axios.delete(api.tasks.delete(taskId))
      await fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const incompleteTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  if (loading) return <div className="text-gray-500 text-center py-8">Loading tasks...</div>


  return (
    <div className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-cyan-900/30 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase tracking-wider">
            Daily Tasks
          </h3>
          <p className="text-xs text-gray-500 mt-1">{incompleteTasks.length} active • {completedTasks.length} completed today</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-4 py-2 rounded-lg text-sm"
        >
          + New Task
        </button>
      </div>

      {/* Task List */}
      {incompleteTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-5xl mb-3">✨</div>
          <p>No active tasks. Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incompleteTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 bg-black/40 border border-gray-800 rounded-lg p-4 hover:border-cyan-900/50 transition-all group">
              <button
                onClick={() => completeTask(task.id)}
                disabled={completingTask === task.id}
                className="w-7 h-7 rounded-full border-2 border-gray-600 hover:border-green-400 hover:bg-green-900/30 flex items-center justify-center transition-all flex-shrink-0"
              >
                {completingTask === task.id ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-transparent group-hover:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className="text-2xl">{pillarIcons[task.life_pillar] || '⭐'}</span>
              <div className="flex-1">
                <div className="text-white font-medium">{task.title}</div>
                {task.description && <div className="text-gray-500 text-sm">{task.description}</div>}
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded capitalize">{task.life_pillar.replace('_', ' ')}</span>
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">~{task.estimated_duration}min</span>
                  {task.priority === 'urgent' && <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">URGENT</span>}
                  {task.priority === 'high' && <span className="text-xs bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">HIGH</span>}
                </div>
              </div>
              <span className="text-yellow-400 font-bold">+{task.xp_reward} XP</span>
              <button onClick={() => deleteTask(task.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      {completedTasks.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-800">
          <h4 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Completed ({completedTasks.length})</h4>
          <div className="space-y-2">
            {completedTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center gap-2 text-gray-500 text-sm">
                <span className="text-green-500">✓</span>
                <span className="line-through">{task.title}</span>
                <span className="text-yellow-500/50">+{task.xp_reward} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h4 className="text-xl font-bold text-white mb-4">Create Task</h4>
            <form onSubmit={createTask} className="space-y-4">
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask(p => ({ ...p, title: e.target.value }))}
                placeholder="Task title"
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white"
                required
              />
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask(p => ({ ...p, description: e.target.value }))}
                placeholder="Description (optional)"
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white h-20 resize-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newTask.life_pillar}
                  onChange={(e) => setNewTask(p => ({ ...p, life_pillar: e.target.value }))}
                  className="bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white"
                >
                  {LIFE_PILLARS.map(p => <option key={p} value={p}>{pillarIcons[p]} {p.replace('_', ' ')}</option>)}
                </select>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask(p => ({ ...p, priority: e.target.value }))}
                  className="bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white"
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400">Duration: {newTask.estimated_duration}min ({Math.round(newTask.estimated_duration / 15) * 10} XP)</label>
                <input
                  type="range" min="15" max="120" step="15"
                  value={newTask.estimated_duration}
                  onChange={(e) => setNewTask(p => ({ ...p, estimated_duration: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-500"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-lg">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
