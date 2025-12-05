'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import QuestCompleteAnimation from './QuestCompleteAnimation'
import { api } from '../../lib/api'

interface Quest {
  id: string
  title: string
  description: string
  life_pillar: string
  target_value: number | null
  target_unit: string | null
  current_value: number
  progress_percent: number
  xp_reward: number
  difficulty: string
  is_completed: boolean
}

interface CompletedQuestData {
  title: string
  pillar: string
  xp: number
  difficulty: string
}

interface QuestBoardProps {
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

const pillarColors: Record<string, string> = {
  health: 'from-red-600 to-red-800',
  career: 'from-blue-600 to-blue-800',
  relationships: 'from-pink-600 to-pink-800',
  personal_growth: 'from-purple-600 to-purple-800',
  finance: 'from-green-600 to-green-800',
  recreation: 'from-yellow-600 to-yellow-800'
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/50',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  hard: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  legendary: 'bg-purple-500/20 text-purple-400 border-purple-500/50'
}

export default function QuestBoard({ userId, onXpGained }: QuestBoardProps) {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null)
  const [updatingQuest, setUpdatingQuest] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [completionAnimation, setCompletionAnimation] = useState<CompletedQuestData | null>(null)


  useEffect(() => {
    fetchQuests()
  }, [userId, selectedPillar, showCompleted])

  const fetchQuests = async () => {
    try {
      setLoading(true)
      const response = await axios.get(api.quests.list(userId, showCompleted, selectedPillar || undefined))
      setQuests(response.data)
    } catch (error) {
      console.error('Error fetching quests:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateQuests = async () => {
    setGenerating(true)
    try {
      await axios.post(api.quests.generate(userId, selectedPillar || undefined))
      await fetchQuests()
    } catch (error) {
      console.error('Error generating quests:', error)
    } finally {
      setGenerating(false)
    }
  }

  const updateProgress = async (questId: string, newValue: number) => {
    setUpdatingQuest(questId)
    try {
      const quest = quests.find(q => q.id === questId)
      const response = await axios.patch(api.quests.progress(questId), {
        current_value: newValue
      })
      
      if (response.data.is_completed && response.data.xp_earned > 0 && quest) {
        setCompletionAnimation({
          title: quest.title,
          pillar: quest.life_pillar,
          xp: response.data.xp_earned,
          difficulty: quest.difficulty
        })
      }
      
      await fetchQuests()
    } catch (error) {
      console.error('Error updating progress:', error)
    } finally {
      setUpdatingQuest(null)
    }
  }

  const completeQuest = async (questId: string) => {
    setUpdatingQuest(questId)
    try {
      const quest = quests.find(q => q.id === questId)
      const response = await axios.post(api.quests.complete(questId))
      
      if (response.data.xp_earned > 0 && quest) {
        setCompletionAnimation({
          title: quest.title,
          pillar: response.data.pillar,
          xp: response.data.xp_earned,
          difficulty: quest.difficulty
        })
      }
      
      await fetchQuests()
    } catch (error) {
      console.error('Error completing quest:', error)
    } finally {
      setUpdatingQuest(null)
    }
  }

  const handleAnimationComplete = () => {
    if (completionAnimation) {
      onXpGained?.(completionAnimation.pillar, completionAnimation.xp)
    }
    setCompletionAnimation(null)
  }

  const abandonQuest = async (questId: string) => {
    try {
      await axios.delete(api.quests.delete(questId))
      await fetchQuests()
    } catch (error) {
      console.error('Error abandoning quest:', error)
    }
  }

  const activeQuests = quests.filter(q => !q.is_completed)
  const completedQuests = quests.filter(q => q.is_completed)


  return (
    <>
      {/* Quest Completion Animation */}
      <QuestCompleteAnimation
        isVisible={completionAnimation !== null}
        xpAmount={completionAnimation?.xp || 0}
        pillar={completionAnimation?.pillar || ''}
        questTitle={completionAnimation?.title || ''}
        difficulty={completionAnimation?.difficulty || 'medium'}
        onComplete={handleAnimationComplete}
      />

      <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-blue-900/30 rounded-lg shadow-2xl p-6">
        {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 uppercase tracking-wider">
            🏆 Achievement Quests
          </h3>
          <p className="text-xs text-gray-500 mt-1">AI-generated challenges to level up your life</p>
        </div>
        <button
          onClick={generateQuests}
          disabled={generating}
          className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold px-4 py-2 rounded-lg text-sm uppercase tracking-wider transition-all flex items-center gap-2"
        >
          {generating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : (
            <>✨ Generate Quests</>
          )}
        </button>
      </div>

      {/* Pillar Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedPillar(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            !selectedPillar ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {Object.entries(pillarIcons).map(([pillar, icon]) => (
          <button
            key={pillar}
            onClick={() => setSelectedPillar(pillar)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              selectedPillar === pillar ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {icon} {pillar.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Toggle completed */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowCompleted(false)}
          className={`text-xs px-3 py-1 rounded ${!showCompleted ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          Active ({activeQuests.length})
        </button>
        <button
          onClick={() => setShowCompleted(true)}
          className={`text-xs px-3 py-1 rounded ${showCompleted ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          Completed ({completedQuests.length})
        </button>
      </div>

      {/* Quest List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading quests...</div>
      ) : quests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-500 uppercase tracking-wider text-sm">No quests yet</p>
          <p className="text-gray-700 text-xs mt-1">Click "Generate Quests" to get AI-powered challenges</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`bg-gradient-to-r ${pillarColors[quest.life_pillar] || 'from-gray-700 to-gray-800'} rounded-lg p-4 relative overflow-hidden ${
                quest.is_completed ? 'opacity-60' : ''
              }`}
            >
              {/* Difficulty badge */}
              <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-bold uppercase border ${difficultyColors[quest.difficulty]}`}>
                {quest.difficulty}
              </div>

              <div className="flex items-start gap-3">
                <div className="text-3xl">{pillarIcons[quest.life_pillar] || '⭐'}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-lg">{quest.title}</h4>
                  <p className="text-white/70 text-sm mt-1">{quest.description}</p>
                  
                  {/* Progress bar */}
                  {quest.target_value && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>{quest.current_value} / {quest.target_value} {quest.target_unit}</span>
                        <span>{Math.round(quest.progress_percent)}%</span>
                      </div>
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white/80 rounded-full transition-all duration-500"
                          style={{ width: `${quest.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs bg-black/30 text-yellow-300 px-2 py-1 rounded font-bold">
                      +{quest.xp_reward} XP
                    </span>
                    
                    {!quest.is_completed && (
                      <>
                        {/* Checkbox to complete */}
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => completeQuest(quest.id)}
                              disabled={updatingQuest === quest.id}
                              className="sr-only"
                            />
                            <div className={`w-6 h-6 rounded border-2 border-white/40 bg-black/30 flex items-center justify-center transition-all group-hover:border-green-400 group-hover:bg-green-900/30 ${updatingQuest === quest.id ? 'animate-pulse' : ''}`}>
                              {updatingQuest === quest.id ? (
                                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-white/0 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-white/60 text-xs group-hover:text-green-400 transition-colors">
                            Mark Complete
                          </span>
                        </label>
                        
                        <button
                          onClick={() => abandonQuest(quest.id)}
                          className="text-white/40 hover:text-red-400 text-xs transition-colors"
                        >
                          Abandon
                        </button>
                      </>
                    )}
                    
                    {quest.is_completed && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-green-400 text-xs font-bold">COMPLETED</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  )
}
