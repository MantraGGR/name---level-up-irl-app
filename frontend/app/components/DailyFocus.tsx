'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { api } from '../../lib/api'

interface Task {
  id: string
  title: string
  life_pillar: string
  xp_reward: number
  completed: boolean
  estimated_duration: number
}

interface Quest {
  id: string
  title: string
  life_pillar: string
  xp_reward: number
  difficulty: string
  progress_percent: number
}

interface DailyFocusProps {
  userId: string
  onTaskComplete?: (pillar: string, xp: number) => void
}

const pillarIcons: Record<string, string> = {
  health: '💪',
  career: '🎯',
  relationships: '🤝',
  personal_growth: '📚',
  finance: '💰',
  recreation: '🎮'
}

export default function DailyFocus({ userId, onTaskComplete }: DailyFocusProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [completingTask, setCompletingTask] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tasksRes, questsRes] = await Promise.all([
        axios.get(api.tasks.list(userId)),
        axios.get(api.quests.list(userId, false))
      ])
      setTasks(tasksRes.data.filter((t: Task) => !t.completed).slice(0, 5))
      setQuests(questsRes.data.slice(0, 3))
    } catch (error) {
      console.error('Error fetching daily focus:', error)
    } finally {
      setLoading(false)
    }
  }

  const completeTask = async (taskId: string) => {
    setCompletingTask(taskId)
    try {
      const response = await axios.patch(api.tasks.complete(taskId))
      onTaskComplete?.(response.data.life_pillar, response.data.xp_earned)
      await fetchData()
    } catch (error) {
      console.error('Error completing task:', error)
    } finally {
      setCompletingTask(null)
    }
  }

  const totalXpAvailable = tasks.reduce((sum, t) => sum + t.xp_reward, 0) + 
                           quests.reduce((sum, q) => sum + q.xp_reward, 0)

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-cyan-900/30 rounded-lg p-6">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }


  return (
    <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-cyan-900/30 rounded-lg shadow-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase tracking-wider">
            ⚡ Today's Focus
          </h3>
          <p className="text-xs text-gray-500">{totalXpAvailable} XP available today</p>
        </div>
        <Link 
          href="/quests"
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View All Quests →
        </Link>
      </div>

      {tasks.length === 0 && quests.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✨</div>
          <p className="text-gray-500 text-sm">All caught up! Create new tasks or generate quests.</p>
          <Link 
            href="/quests"
            className="inline-block mt-3 text-sm bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go to Quests
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Tasks */}
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 bg-black/40 border border-gray-800 rounded-lg p-3 hover:border-cyan-900/50 transition-all group"
            >
              <button
                onClick={() => completeTask(task.id)}
                disabled={completingTask === task.id}
                className="w-6 h-6 rounded border-2 border-gray-600 hover:border-green-400 hover:bg-green-900/30 flex items-center justify-center transition-all flex-shrink-0"
              >
                {completingTask === task.id ? (
                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-transparent group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              
              <span className="text-lg">{pillarIcons[task.life_pillar] || '⭐'}</span>
              
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{task.title}</div>
                <div className="text-xs text-gray-500">~{task.estimated_duration || 30} min</div>
              </div>
              
              <span className="text-xs text-yellow-400 font-bold">+{task.xp_reward} XP</span>
            </div>
          ))}

          {/* Active Quests Preview */}
          {quests.length > 0 && (
            <>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-4 mb-2">Active Quests</div>
              {quests.map((quest) => (
                <div
                  key={quest.id}
                  className="flex items-center gap-3 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-900/30 rounded-lg p-3"
                >
                  <span className="text-lg">{pillarIcons[quest.life_pillar] || '🏆'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{quest.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 rounded-full"
                          style={{ width: `${quest.progress_percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{Math.round(quest.progress_percent)}%</span>
                    </div>
                  </div>
                  <span className="text-xs text-yellow-400 font-bold">+{quest.xp_reward} XP</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
