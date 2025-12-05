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
  unlocked: boolean
}

interface Goal {
  id: string
  title: string
  description: string
  life_pillar: string
  ai_analysis: string
  estimated_timeframe: string
  difficulty_rating: string
  milestones: Milestone[]
  current_milestone_index: number
  progress_percent: number
  total_xp_earned: number
  is_completed: boolean
}

interface LongTermGoalsProps {
  userId: string
  onXpGained?: (pillar: string, amount: number) => void
}

const pillarIcons: Record<string, string> = {
  health: '💪',
  career: '🎯',
  relationships: '🤝',
  personal_growth: '📚',
  finance: '💰',
  recreation: '🎮'
}

const pillarColors: Record<string, { gradient: string; border: string }> = {
  health: { gradient: 'from-red-600 to-red-900', border: 'border-red-500/50' },
  career: { gradient: 'from-blue-600 to-blue-900', border: 'border-blue-500/50' },
  relationships: { gradient: 'from-pink-600 to-pink-900', border: 'border-pink-500/50' },
  personal_growth: { gradient: 'from-purple-600 to-purple-900', border: 'border-purple-500/50' },
  finance: { gradient: 'from-green-600 to-green-900', border: 'border-green-500/50' },
  recreation: { gradient: 'from-yellow-600 to-yellow-900', border: 'border-yellow-500/50' }
}

const difficultyBadges: Record<string, { color: string; label: string }> = {
  achievable: { color: 'bg-green-500/20 text-green-400', label: '✓ Achievable' },
  challenging: { color: 'bg-blue-500/20 text-blue-400', label: '⚡ Challenging' },
  ambitious: { color: 'bg-orange-500/20 text-orange-400', label: '🔥 Ambitious' },
  legendary: { color: 'bg-purple-500/20 text-purple-400', label: '👑 Legendary' }
}

const LIFE_PILLARS = ['health', 'career', 'relationships', 'personal_growth', 'finance', 'recreation']


export default function LongTermGoals({ userId, onXpGained }: LongTermGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [completingMilestone, setCompletingMilestone] = useState<string | null>(null)
  const [completionAnimation, setCompletionAnimation] = useState<{
    title: string
    pillar: string
    xp: number
    difficulty: string
  } | null>(null)
  
  const [newGoal, setNewGoal] = useState({
    description: '',
    life_pillar: 'finance'
  })

  useEffect(() => {
    fetchGoals()
  }, [userId])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const response = await axios.get(api.goals.list(userId))
      setGoals(response.data)
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoal.description.trim()) return
    
    setCreating(true)
    try {
      const response = await axios.post(api.goals.create(userId), {
        goal_description: newGoal.description,
        life_pillar: newGoal.life_pillar
      })
      
      await fetchGoals()
      setShowCreateModal(false)
      setNewGoal({ description: '', life_pillar: 'finance' })
      
      // Auto-expand the new goal
      setExpandedGoal(response.data.id)
    } catch (error) {
      console.error('Error creating goal:', error)
    } finally {
      setCreating(false)
    }
  }

  const completeMilestone = async (goalId: string, milestoneId: string, milestone: Milestone) => {
    setCompletingMilestone(milestoneId)
    try {
      const response = await axios.post(api.goals.completeMilestone(goalId, milestoneId))
      
      // Trigger animation
      setCompletionAnimation({
        title: milestone.title,
        pillar: response.data.pillar,
        xp: response.data.xp_earned,
        difficulty: response.data.goal_completed ? 'legendary' : 'hard'
      })
      
      await fetchGoals()
    } catch (error) {
      console.error('Error completing milestone:', error)
    } finally {
      setCompletingMilestone(null)
    }
  }

  const deleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to abandon this goal?')) return
    
    try {
      await axios.delete(api.goals.delete(goalId))
      await fetchGoals()
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const handleAnimationComplete = () => {
    if (completionAnimation) {
      onXpGained?.(completionAnimation.pillar, completionAnimation.xp)
    }
    setCompletionAnimation(null)
  }

  const activeGoals = goals.filter(g => !g.is_completed)
  const completedGoals = goals.filter(g => g.is_completed)


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

      <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-purple-900/30 rounded-lg shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-wider">
              🌟 Long-Term Goals
            </h3>
            <p className="text-xs text-gray-500 mt-1">Your life missions with AI-powered roadmaps</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-4 py-2 rounded-lg text-sm uppercase tracking-wider transition-all flex items-center gap-2"
          >
            🎯 Set New Goal
          </button>
        </div>

        {/* Goals List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌟</div>
            <p className="text-gray-400 text-lg mb-2">What's your dream?</p>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              Tell us your biggest life goal and our AI will create a personalized roadmap to help you achieve it.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-6 py-3 rounded-lg transition-all"
            >
              Set Your First Goal
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeGoals.map((goal) => {
              const colors = pillarColors[goal.life_pillar] || pillarColors.personal_growth
              const isExpanded = expandedGoal === goal.id
              const currentMilestone = goal.milestones.find(m => m.unlocked && !m.is_completed)
              
              return (
                <div
                  key={goal.id}
                  className={`bg-gradient-to-r ${colors.gradient} rounded-xl overflow-hidden border ${colors.border}`}
                >
                  {/* Goal Header */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="text-4xl">{pillarIcons[goal.life_pillar] || '⭐'}</div>
                        <div>
                          <h4 className="font-bold text-white text-xl">{goal.title}</h4>
                          <p className="text-white/60 text-sm mt-1">{goal.description}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${difficultyBadges[goal.difficulty_rating]?.color || 'bg-gray-500/20 text-gray-400'}`}>
                              {difficultyBadges[goal.difficulty_rating]?.label || goal.difficulty_rating}
                            </span>
                            <span className="text-xs text-white/50">
                              ⏱️ {goal.estimated_timeframe}
                            </span>
                            <span className="text-xs text-yellow-300">
                              +{goal.total_xp_earned} XP earned
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">
                          {Math.round(goal.progress_percent)}%
                        </div>
                        <div className="text-xs text-white/50">
                          {goal.current_milestone_index}/{goal.milestones.length} milestones
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-4 h-2 bg-black/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-white/80 to-white/60 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress_percent}%` }}
                      />
                    </div>
                    
                    {/* Current milestone preview */}
                    {currentMilestone && !isExpanded && (
                      <div className="mt-3 text-sm text-white/70">
                        <span className="text-white/50">Next:</span> {currentMilestone.title}
                      </div>
                    )}
                  </div>

                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="bg-black/30 p-4 border-t border-white/10">
                      {/* AI Analysis */}
                      <div className="mb-4 p-3 bg-black/30 rounded-lg border border-white/10">
                        <div className="text-xs text-purple-300 uppercase tracking-wider mb-1">🤖 AI Analysis</div>
                        <p className="text-white/80 text-sm">{goal.ai_analysis}</p>
                      </div>
                      
                      {/* Milestone Roadmap */}
                      <div className="text-xs text-white/50 uppercase tracking-wider mb-3">📍 Your Roadmap</div>
                      <div className="space-y-2">
                        {goal.milestones.map((milestone, index) => (
                          <div
                            key={milestone.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                              milestone.is_completed
                                ? 'bg-green-900/30 border border-green-500/30'
                                : milestone.unlocked
                                  ? 'bg-white/10 border border-white/20'
                                  : 'bg-black/20 border border-white/5 opacity-50'
                            }`}
                          >
                            {/* Step number / checkbox */}
                            <div className="flex-shrink-0">
                              {milestone.is_completed ? (
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : milestone.unlocked ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    completeMilestone(goal.id, milestone.id, milestone)
                                  }}
                                  disabled={completingMilestone === milestone.id}
                                  className="w-8 h-8 rounded-full border-2 border-white/40 hover:border-green-400 hover:bg-green-900/30 flex items-center justify-center transition-all group"
                                >
                                  {completingMilestone === milestone.id ? (
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 text-white/0 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 text-sm font-bold">
                                  {index + 1}
                                </div>
                              )}
                            </div>
                            
                            {/* Milestone content */}
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium ${milestone.is_completed ? 'text-green-300 line-through' : milestone.unlocked ? 'text-white' : 'text-gray-500'}`}>
                                {milestone.title}
                              </div>
                              <div className={`text-xs mt-0.5 ${milestone.unlocked ? 'text-white/60' : 'text-gray-600'}`}>
                                {milestone.description}
                              </div>
                            </div>
                            
                            {/* XP reward */}
                            <div className={`text-xs font-bold ${milestone.is_completed ? 'text-green-400' : 'text-yellow-300/70'}`}>
                              +{milestone.xp_reward} XP
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteGoal(goal.id)
                        }}
                        className="mt-4 text-xs text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        Abandon Goal
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            
            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-800">
                <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-3">🏆 Achieved Goals ({completedGoals.length})</h4>
                {completedGoals.map((goal) => (
                  <div key={goal.id} className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{pillarIcons[goal.life_pillar]}</span>
                      <span className="text-green-300 font-medium">{goal.title}</span>
                      <span className="text-xs text-yellow-400">+{goal.total_xp_earned} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Create Goal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-lg">
              <h4 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                🌟 Set Your Life Goal
              </h4>
              <p className="text-gray-400 text-sm mb-6">
                Dream big! Tell us what you want to achieve and our AI will create a personalized roadmap.
              </p>
              
              <form onSubmit={createGoal} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                    What's your dream? Be specific!
                  </label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 h-32 resize-none"
                    placeholder="e.g., I want to make $10 million, run a marathon, write a bestselling book, find my soulmate..."
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
                        onClick={() => setNewGoal(prev => ({ ...prev, life_pillar: pillar }))}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          newGoal.life_pillar === pillar
                            ? 'bg-purple-600/30 border-purple-500 text-white'
                            : 'bg-black/30 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-2xl mb-1">{pillarIcons[pillar]}</div>
                        <div className="text-xs capitalize">{pillar.replace('_', ' ')}</div>
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
                    disabled={creating || !newGoal.description.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        AI is thinking...
                      </>
                    ) : (
                      <>🚀 Create Roadmap</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
