'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import QuestCompleteAnimation from './QuestCompleteAnimation'
import { api } from '../../lib/api'

interface Milestone {
  id: string
  title: string
  description: string
  order: number
  xp_reward: number
  is_completed: boolean
}

interface UltimateGoal {
  id: string
  pillar: string
  title: string
  description: string
  icon: string
  milestones: Milestone[]
  current_milestone_index: number
  progress_percent: number
  total_xp_earned: number
  is_completed: boolean
  is_custom?: boolean
}

interface UltimateGoalsProps {
  userId: string
  onXpGained?: (pillar: string, amount: number) => void
}

const pillarOrder = ['finance', 'health', 'career', 'relationships', 'personal_growth', 'recreation']

const pillarGradients: Record<string, string> = {
  finance: 'from-emerald-600 via-green-600 to-teal-700',
  health: 'from-red-600 via-rose-600 to-pink-700',
  career: 'from-blue-600 via-indigo-600 to-violet-700',
  relationships: 'from-pink-600 via-fuchsia-600 to-purple-700',
  personal_growth: 'from-purple-600 via-violet-600 to-indigo-700',
  recreation: 'from-amber-500 via-orange-500 to-red-600'
}

const LIFE_PILLARS = ['health', 'career', 'relationships', 'personal_growth', 'finance', 'recreation']
const pillarIcons: Record<string, string> = {
  health: '💪', career: '🎯', relationships: '🤝',
  personal_growth: '📚', finance: '💰', recreation: '🎮'
}
const goalIcons = ['🎯', '🏆', '💎', '🚀', '⭐', '👑', '🌟', '💫', '🔥', '💪']

export default function UltimateGoals({ userId, onXpGained }: UltimateGoalsProps) {
  const [goals, setGoals] = useState<UltimateGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)
  const [completingMilestone, setCompletingMilestone] = useState<string | null>(null)
  const [completionAnimation, setCompletionAnimation] = useState<{
    title: string
    pillar: string
    xp: number
    difficulty: string
  } | null>(null)
  
  // Create goal modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    pillar: 'personal_growth',
    icon: '🎯'
  })


  useEffect(() => {
    fetchGoals()
  }, [userId])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const response = await axios.get(api.ultimateGoals.list(userId))
      // Sort by pillar order
      const sorted = response.data.sort((a: UltimateGoal, b: UltimateGoal) => 
        pillarOrder.indexOf(a.pillar) - pillarOrder.indexOf(b.pillar)
      )
      setGoals(sorted)
    } catch (error) {
      console.error('Error fetching ultimate goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const completeMilestone = async (goalId: string, milestoneId: string, milestone: Milestone, pillar: string) => {
    setCompletingMilestone(milestoneId)
    try {
      const response = await axios.post(api.ultimateGoals.completeMilestone(goalId, milestoneId))
      
      setCompletionAnimation({
        title: milestone.title,
        pillar: pillar,
        xp: response.data.xp_earned,
        difficulty: response.data.goal_completed ? 'legendary' : 'hard'
      })
      
      await fetchGoals()
    } catch (error: any) {
      console.error('Error completing milestone:', error)
      alert(error.response?.data?.detail || 'Failed to complete milestone')
    } finally {
      setCompletingMilestone(null)
    }
  }

  const handleAnimationComplete = () => {
    if (completionAnimation) {
      onXpGained?.(completionAnimation.pillar, completionAnimation.xp)
    }
    setCompletionAnimation(null)
  }

  const createCustomGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoal.title.trim() || !newGoal.description.trim()) return
    
    setCreating(true)
    try {
      await axios.post(api.ultimateGoals.createCustom(userId), {
        title: newGoal.title,
        description: newGoal.description,
        pillar: newGoal.pillar,
        icon: newGoal.icon
      })
      await fetchGoals()
      setShowCreateModal(false)
      setNewGoal({ title: '', description: '', pillar: 'personal_growth', icon: '🎯' })
    } catch (error) {
      console.error('Error creating goal:', error)
    } finally {
      setCreating(false)
    }
  }

  const deleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal? This cannot be undone.')) return
    try {
      await axios.delete(api.ultimateGoals.delete(goalId))
      await fetchGoals()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete goal')
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-yellow-900/30 rounded-lg shadow-2xl p-6">
        <div className="text-center py-8 text-gray-500">Loading ultimate goals...</div>
      </div>
    )
  }


  return (
    <>
      <QuestCompleteAnimation
        isVisible={completionAnimation !== null}
        xpAmount={completionAnimation?.xp || 0}
        pillar={completionAnimation?.pillar || ''}
        questTitle={completionAnimation?.title || ''}
        difficulty={completionAnimation?.difficulty || 'hard'}
        onComplete={handleAnimationComplete}
      />

      <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-yellow-900/30 rounded-lg shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 uppercase tracking-wider">
              👑 Ultimate Life Goals
            </h3>
            <p className="text-xs text-gray-500 mt-1">Your pinnacle achievements in each life area</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold px-4 py-2 rounded-lg text-sm uppercase tracking-wider transition-all flex items-center gap-2"
          >
            ✨ Create Your Own
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const isExpanded = expandedGoal === goal.id
            const currentMilestone = goal.milestones[goal.current_milestone_index]
            const gradient = pillarGradients[goal.pillar] || 'from-gray-600 to-gray-800'
            
            return (
              <div
                key={goal.id}
                className={`rounded-xl overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'col-span-full' : ''
                } ${goal.is_completed ? 'ring-2 ring-yellow-400' : ''}`}
              >
                {/* Card Header */}
                <div
                  className={`bg-gradient-to-br ${gradient} p-4 cursor-pointer relative overflow-hidden`}
                  onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                >
                  {/* Shimmer effect for completed */}
                  {goal.is_completed && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  )}
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{goal.icon}</div>
                      <div>
                        <h4 className="font-black text-white text-lg">{goal.title}</h4>
                        <p className="text-white/60 text-xs capitalize">{goal.pillar.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-white">{Math.round(goal.progress_percent)}%</div>
                      <div className="text-xs text-white/50">{goal.current_milestone_index}/{goal.milestones.length}</div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-black/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/80 rounded-full transition-all duration-700"
                      style={{ width: `${goal.progress_percent}%` }}
                    />
                  </div>
                  
                  {/* Current milestone preview */}
                  {currentMilestone && !isExpanded && (
                    <div className="mt-2 text-xs text-white/70">
                      <span className="text-white/40">Next:</span> {currentMilestone.title}
                    </div>
                  )}
                  
                  {goal.is_completed && (
                    <div className="mt-2 text-yellow-300 text-xs font-bold">🏆 ULTIMATE GOAL ACHIEVED!</div>
                  )}
                </div>


                {/* Expanded Milestones */}
                {isExpanded && (
                  <div className="bg-black/60 p-4">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-400 text-sm flex-1">{goal.description}</p>
                      {goal.is_custom && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id) }}
                          className="text-xs text-red-400/60 hover:text-red-400 ml-4 transition-colors"
                        >
                          Delete Goal
                        </button>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                      Milestone Roadmap • {goal.total_xp_earned} XP Earned
                      {goal.is_custom && <span className="ml-2 text-yellow-500">✨ Custom Goal</span>}
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {goal.milestones.map((milestone, index) => {
                        const isUnlocked = index <= goal.current_milestone_index
                        const isCurrent = index === goal.current_milestone_index && !goal.is_completed
                        
                        return (
                          <div
                            key={milestone.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                              milestone.is_completed
                                ? 'bg-green-900/30 border border-green-500/30'
                                : isCurrent
                                  ? 'bg-yellow-900/20 border border-yellow-500/30'
                                  : 'bg-gray-900/50 border border-gray-800 opacity-40'
                            }`}
                          >
                            {/* Checkbox / Number */}
                            <div className="flex-shrink-0">
                              {milestone.is_completed ? (
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : isCurrent ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    completeMilestone(goal.id, milestone.id, milestone, goal.pillar)
                                  }}
                                  disabled={completingMilestone === milestone.id}
                                  className="w-8 h-8 rounded-full border-2 border-yellow-400 bg-yellow-900/30 hover:bg-yellow-500/30 flex items-center justify-center transition-all group"
                                >
                                  {completingMilestone === milestone.id ? (
                                    <svg className="animate-spin h-4 w-4 text-yellow-400" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-600 text-sm font-bold">
                                  {index + 1}
                                </div>
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium ${
                                milestone.is_completed ? 'text-green-300' : 
                                isCurrent ? 'text-yellow-300' : 'text-gray-500'
                              }`}>
                                {milestone.title}
                              </div>
                              <div className={`text-xs mt-0.5 ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                                {milestone.description}
                              </div>
                            </div>
                            
                            {/* XP */}
                            <div className={`text-xs font-bold ${
                              milestone.is_completed ? 'text-green-400' : 
                              isCurrent ? 'text-yellow-400' : 'text-gray-600'
                            }`}>
                              +{milestone.xp_reward} XP
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Create Custom Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-6 w-full max-w-lg">
            <h4 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
              ✨ Create Your Ultimate Goal
            </h4>
            <p className="text-gray-400 text-sm mb-6">
              Dream big! Our AI will create a personalized roadmap to help you achieve it.
            </p>
            
            <form onSubmit={createCustomGoal} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                  What's your ultimate goal?
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                  placeholder="e.g., Become a millionaire, Run an ultramarathon, Write a bestseller..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                  Describe your vision in detail
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 h-24 resize-none"
                  placeholder="What does achieving this goal look like? Why is it important to you? Be specific..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                  Life Area
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LIFE_PILLARS.map(pillar => (
                    <button
                      key={pillar}
                      type="button"
                      onClick={() => setNewGoal(prev => ({ ...prev, pillar }))}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        newGoal.pillar === pillar
                          ? 'bg-yellow-600/30 border-yellow-500 text-white'
                          : 'bg-black/30 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">{pillarIcons[pillar]}</div>
                      <div className="text-xs capitalize">{pillar.replace('_', ' ')}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                  Choose an Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {goalIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewGoal(prev => ({ ...prev, icon }))}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        newGoal.icon === icon
                          ? 'bg-yellow-600/30 border-2 border-yellow-500'
                          : 'bg-black/30 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newGoal.title.trim() || !newGoal.description.trim()}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      AI is creating roadmap...
                    </>
                  ) : (
                    <>🚀 Create Goal</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  )
}
