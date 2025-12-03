'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Question {
  id: string
  text: string
  category: 'health' | 'finance' | 'relationships' | 'career' | 'personal_growth' | 'recreation' | 'adhd' | 'anxiety' | 'depression'
  options: { value: number; label: string }[]
}

const questions: Question[] = [
  // HEALTH / Physical questions
  { id: 'health1', text: 'How would you rate your current physical fitness level?', category: 'health', options: [
    { value: 4, label: 'Excellent - I exercise regularly' }, { value: 3, label: 'Good - I stay fairly active' }, { value: 2, label: 'Average - Some activity' }, { value: 1, label: 'Below average - Rarely exercise' }, { value: 0, label: 'Poor - Very sedentary' }
  ]},
  { id: 'health2', text: 'How many hours of sleep do you typically get?', category: 'health', options: [
    { value: 4, label: '7-9 hours consistently' }, { value: 3, label: '6-7 hours usually' }, { value: 2, label: '5-6 hours' }, { value: 1, label: 'Less than 5 hours' }, { value: 0, label: 'Very irregular sleep' }
  ]},
  
  // FINANCE questions
  { id: 'finance1', text: 'How comfortable are you with your current financial situation?', category: 'finance', options: [
    { value: 4, label: 'Very comfortable - Savings & investments' }, { value: 3, label: 'Comfortable - Bills paid, some savings' }, { value: 2, label: 'Getting by - Living paycheck to paycheck' }, { value: 1, label: 'Struggling - Difficulty with bills' }, { value: 0, label: 'In crisis - Significant debt/issues' }
  ]},
  { id: 'finance2', text: 'Do you have a budget or track your spending?', category: 'finance', options: [
    { value: 4, label: 'Yes, detailed tracking & budget' }, { value: 3, label: 'Basic budget in place' }, { value: 2, label: 'Loosely track spending' }, { value: 1, label: 'Rarely track anything' }, { value: 0, label: 'No idea where money goes' }
  ]},
  
  // RELATIONSHIPS / Social questions
  { id: 'social1', text: 'How comfortable are you in social situations?', category: 'relationships', options: [
    { value: 4, label: 'Very comfortable - I thrive socially' }, { value: 3, label: 'Comfortable - Enjoy most gatherings' }, { value: 2, label: 'Neutral - Depends on the situation' }, { value: 1, label: 'Uncomfortable - Prefer small groups' }, { value: 0, label: 'Very anxious - Avoid social events' }
  ]},
  { id: 'social2', text: 'How satisfied are you with your close relationships?', category: 'relationships', options: [
    { value: 4, label: 'Very satisfied - Strong support network' }, { value: 3, label: 'Satisfied - Good relationships' }, { value: 2, label: 'Neutral - Some good, some challenging' }, { value: 1, label: 'Unsatisfied - Feel disconnected' }, { value: 0, label: 'Very lonely - Lack meaningful connections' }
  ]},
  
  // CAREER questions
  { id: 'career1', text: 'How satisfied are you with your current career/work?', category: 'career', options: [
    { value: 4, label: 'Love it - Fulfilling and growing' }, { value: 3, label: 'Good - Generally satisfied' }, { value: 2, label: 'Okay - It pays the bills' }, { value: 1, label: 'Unsatisfied - Looking for change' }, { value: 0, label: 'Miserable - Need to get out' }
  ]},
  { id: 'career2', text: 'How would you rate your work-life balance?', category: 'career', options: [
    { value: 4, label: 'Excellent - Plenty of personal time' }, { value: 3, label: 'Good - Mostly balanced' }, { value: 2, label: 'Fair - Sometimes overwhelmed' }, { value: 1, label: 'Poor - Work dominates life' }, { value: 0, label: 'Non-existent - Completely burned out' }
  ]},
  
  // PERSONAL GROWTH / Intellect questions
  { id: 'growth1', text: 'How often do you learn new skills or knowledge?', category: 'personal_growth', options: [
    { value: 4, label: 'Daily - Always learning' }, { value: 3, label: 'Weekly - Regular learning' }, { value: 2, label: 'Monthly - Occasional learning' }, { value: 1, label: 'Rarely - When forced to' }, { value: 0, label: 'Never - Stuck in routine' }
  ]},
  { id: 'growth2', text: 'Do you have clear goals you\'re working towards?', category: 'personal_growth', options: [
    { value: 4, label: 'Yes - Clear goals with action plans' }, { value: 3, label: 'Mostly - Some defined goals' }, { value: 2, label: 'Vague ideas of what I want' }, { value: 1, label: 'Not really - Day to day focus' }, { value: 0, label: 'No - Feel directionless' }
  ]},
  
  // RECREATION questions
  { id: 'rec1', text: 'How often do you engage in hobbies or fun activities?', category: 'recreation', options: [
    { value: 4, label: 'Daily - Always make time for fun' }, { value: 3, label: 'Several times a week' }, { value: 2, label: 'Weekly - When I can' }, { value: 1, label: 'Rarely - Too busy' }, { value: 0, label: 'Never - No time for myself' }
  ]},
  { id: 'rec2', text: 'How would you rate your overall life enjoyment?', category: 'recreation', options: [
    { value: 4, label: 'Loving life!' }, { value: 3, label: 'Pretty good most days' }, { value: 2, label: 'It\'s okay' }, { value: 1, label: 'Could be better' }, { value: 0, label: 'Struggling to find joy' }
  ]},

  // ADHD screening
  { id: 'adhd1', text: 'How often do you have difficulty concentrating on tasks?', category: 'adhd', options: [
    { value: 0, label: 'Never' }, { value: 1, label: 'Rarely' }, { value: 2, label: 'Sometimes' }, { value: 3, label: 'Often' }, { value: 4, label: 'Very Often' }
  ]},
  { id: 'adhd2', text: 'How often do you feel restless or have trouble sitting still?', category: 'adhd', options: [
    { value: 0, label: 'Never' }, { value: 1, label: 'Rarely' }, { value: 2, label: 'Sometimes' }, { value: 3, label: 'Often' }, { value: 4, label: 'Very Often' }
  ]},
  
  // Anxiety screening
  { id: 'anx1', text: 'How often do you feel nervous, anxious, or on edge?', category: 'anxiety', options: [
    { value: 0, label: 'Never' }, { value: 1, label: 'Rarely' }, { value: 2, label: 'Sometimes' }, { value: 3, label: 'Often' }, { value: 4, label: 'Very Often' }
  ]},
  { id: 'anx2', text: 'How often do you have trouble relaxing?', category: 'anxiety', options: [
    { value: 0, label: 'Never' }, { value: 1, label: 'Rarely' }, { value: 2, label: 'Sometimes' }, { value: 3, label: 'Often' }, { value: 4, label: 'Very Often' }
  ]},
  
  // Depression screening
  { id: 'dep1', text: 'How often do you feel down, depressed, or hopeless?', category: 'depression', options: [
    { value: 0, label: 'Never' }, { value: 1, label: 'Rarely' }, { value: 2, label: 'Sometimes' }, { value: 3, label: 'Often' }, { value: 4, label: 'Very Often' }
  ]},
  { id: 'dep2', text: 'How often do you have little interest or pleasure in doing things?', category: 'depression', options: [
    { value: 0, label: 'Never' }, { value: 1, label: 'Rarely' }, { value: 2, label: 'Sometimes' }, { value: 3, label: 'Often' }, { value: 4, label: 'Very Often' }
  ]},
]

const categoryLabels: Record<string, { label: string; icon: string }> = {
  health: { label: 'Physical Health', icon: '💪' },
  finance: { label: 'Finances', icon: '💰' },
  relationships: { label: 'Social & Relationships', icon: '🤝' },
  career: { label: 'Career', icon: '🎯' },
  personal_growth: { label: 'Personal Growth', icon: '📚' },
  recreation: { label: 'Recreation & Fun', icon: '🎮' },
  adhd: { label: 'Focus & Attention', icon: '🧠' },
  anxiety: { label: 'Stress & Anxiety', icon: '😰' },
  depression: { label: 'Mood & Energy', icon: '💭' },
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<'name' | 'quiz'>('name')
  const [displayName, setDisplayName] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUserId(payload.sub)
    } catch {
      router.push('/')
    }
  }, [router])

  const handleNameSubmit = () => {
    if (displayName.trim().length >= 2) {
      setStep('quiz')
    }
  }

  const handleAnswer = (value: number) => {
    const question = questions[currentQuestion]
    setAnswers(prev => ({ ...prev, [question.id]: value }))
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 200)
    }
  }

  const handleSubmit = async () => {
    if (!userId) return
    setIsSubmitting(true)

    // Calculate scores by category
    const calculateScore = (prefix: string) => 
      Object.entries(answers)
        .filter(([key]) => key.startsWith(prefix))
        .reduce((sum, [, val]) => sum + val, 0)

    const scores = {
      health: calculateScore('health'),
      finance: calculateScore('finance'),
      relationships: calculateScore('social'),
      career: calculateScore('career'),
      personal_growth: calculateScore('growth'),
      recreation: calculateScore('rec'),
      adhd: calculateScore('adhd'),
      anxiety: calculateScore('anx'),
      depression: calculateScore('dep'),
    }

    try {
      // Submit assessment with all scores
      await fetch('http://localhost:8000/assessments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          adhd_score: scores.adhd,
          anxiety_score: scores.anxiety,
          depression_score: scores.depression,
          responses: { ...answers, pillar_scores: scores }
        })
      })

      // Complete onboarding with display name and pillar scores
      await fetch(`http://localhost:8000/assessments/complete-onboarding/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          display_name: displayName.trim(),
          pillar_scores: {
            health: scores.health,
            finance: scores.finance,
            relationships: scores.relationships,
            career: scores.career,
            personal_growth: scores.personal_growth,
            recreation: scores.recreation,
          }
        })
      })

      // Mark as new user for welcome message
      sessionStorage.setItem('just_onboarded', 'true')
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to submit assessment:', error)
      setIsSubmitting(false)
    }
  }

  // Name input step
  if (step === 'name') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8 flex items-center justify-center">
        <div className="max-w-xl w-full">
          <div className="text-center mb-12">
            <div className="text-6xl mb-6">👋</div>
            <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Welcome, Adventurer!
            </h1>
            <p className="text-gray-400 text-lg">Before we begin your journey, what should we call you?</p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-8">
            <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">Your Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="Enter your name..."
              className="w-full bg-gray-900 border-2 border-gray-700 focus:border-blue-500 rounded-lg px-4 py-4 text-xl text-white placeholder-gray-600 outline-none transition-colors"
              autoFocus
            />
            <p className="text-xs text-gray-600 mt-2">This is how we&apos;ll address you in the app</p>
            
            <button
              onClick={handleNameSubmit}
              disabled={displayName.trim().length < 2}
              className="w-full mt-6 px-6 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold transition-all"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Quiz step
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const question = questions[currentQuestion]
  const category = categoryLabels[question.category]
  const isLastQuestion = currentQuestion === questions.length - 1
  const allAnswered = Object.keys(answers).length === questions.length

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Let&apos;s learn about you, {displayName}! 🎮
          </h1>
          <p className="text-gray-400 text-sm">Your answers help us personalize your experience</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-sm text-gray-500">Question {currentQuestion + 1} of {questions.length}</p>
            <p className="text-sm text-gray-600">{Math.round(progress)}% complete</p>
          </div>
        </div>

        {/* Category badge */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-full text-sm">
            <span>{category.icon}</span>
            <span className="text-gray-300">{category.label}</span>
          </span>
        </div>

        {/* Question */}
        <div className="bg-gray-800/50 rounded-xl p-8 mb-6">
          <h2 className="text-xl mb-6">{question.text}</h2>
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  answers[question.id] === option.value
                    ? 'bg-blue-600 border-blue-400 scale-[1.02]'
                    : 'bg-gray-700/50 hover:bg-gray-700 border-transparent hover:scale-[1.01]'
                } border-2`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => {
              if (currentQuestion === 0) {
                setStep('name')
              } else {
                setCurrentQuestion(prev => prev - 1)
              }
            }}
            className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            ← Back
          </button>
          
          {isLastQuestion && allAnswered ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 font-bold transition-all"
            >
              {isSubmitting ? '⏳ Saving...' : '🚀 Start My Journey'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={answers[question.id] === undefined}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
