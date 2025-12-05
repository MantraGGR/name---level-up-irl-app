'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import dynamic from 'next/dynamic'
import SpaceTunnel from '../components/SpaceTunnel'
import ChatBot from '../components/ChatBot'
import Calendar from '../components/Calendar'
import DailyFocus from '../components/DailyFocus'
import Link from 'next/link'
import { api } from '../../lib/api'

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
  const [loading, setLoading] = useState(true)
  const [showTunnel, setShowTunnel] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
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
      const response = await axios.get(api.auth.me(token))
      setUser(response.data)
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
                <Link href="/quests" className="bg-black/50 border border-cyan-900/50 p-4 rounded-lg hover:border-cyan-500/50 transition-all">
                  <div className="text-xs uppercase tracking-widest text-cyan-300 mb-2">Quest Hub</div>
                  <div className="text-3xl font-black text-cyan-400">🏆</div>
                  <div className="text-xs text-gray-600 mt-1">View All</div>
                </Link>
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

        {/* Daily Focus + Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <DailyFocus 
              userId={user.user_id} 
              onTaskComplete={(pillar, xp) => {
                setXpAnimation({ pillar, amount: xp })
                setTimeout(() => setXpAnimation(null), 2000)
                fetchUserData(localStorage.getItem('token') || '')
              }}
            />
          </div>
          
          {/* Quick Links */}
          <div className="space-y-4">
            <Link 
              href="/quests"
              className="block bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-900/50 rounded-lg p-4 hover:border-yellow-500/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                <div>
                  <div className="font-bold text-white group-hover:text-yellow-400 transition-colors">Quest Hub</div>
                  <div className="text-xs text-gray-500">All quests & goals</div>
                </div>
                <span className="ml-auto text-gray-600 group-hover:text-yellow-400 transition-colors">→</span>
              </div>
            </Link>
            
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">👑</span>
                <div className="font-bold text-white text-sm">Ultimate Goals</div>
              </div>
              <div className="text-xs text-gray-400">
                Track your life missions in the Quest Hub
              </div>
              <Link href="/quests" className="text-xs text-purple-400 hover:text-purple-300 mt-2 inline-block">
                View Progress →
              </Link>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="mt-8">
          <Calendar userId={user.user_id} />
        </div>
      </main>

      <ChatBot userId={user.user_id} onTaskCreated={() => fetchUserData(localStorage.getItem('token') || '')} />
    </div>
  )
}
