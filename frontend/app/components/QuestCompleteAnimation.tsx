'use client'

import { useEffect, useState, useCallback } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  type: 'confetti' | 'star' | 'sparkle'
  opacity: number
}

interface QuestCompleteAnimationProps {
  isVisible: boolean
  xpAmount: number
  pillar: string
  questTitle: string
  difficulty: string
  onComplete: () => void
}

const pillarColors: Record<string, { primary: string; secondary: string; glow: string }> = {
  health: { primary: '#ef4444', secondary: '#fca5a5', glow: 'rgba(239, 68, 68, 0.5)' },
  career: { primary: '#3b82f6', secondary: '#93c5fd', glow: 'rgba(59, 130, 246, 0.5)' },
  relationships: { primary: '#ec4899', secondary: '#f9a8d4', glow: 'rgba(236, 72, 153, 0.5)' },
  personal_growth: { primary: '#8b5cf6', secondary: '#c4b5fd', glow: 'rgba(139, 92, 246, 0.5)' },
  finance: { primary: '#22c55e', secondary: '#86efac', glow: 'rgba(34, 197, 94, 0.5)' },
  recreation: { primary: '#eab308', secondary: '#fde047', glow: 'rgba(234, 179, 8, 0.5)' }
}

const difficultyEmojis: Record<string, string> = {
  easy: '⭐',
  medium: '🌟',
  hard: '💫',
  legendary: '🏆'
}

export default function QuestCompleteAnimation({
  isVisible,
  xpAmount,
  pillar,
  questTitle,
  difficulty,
  onComplete
}: QuestCompleteAnimationProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [showContent, setShowContent] = useState(false)
  const [xpCounter, setXpCounter] = useState(0)
  const [phase, setPhase] = useState<'burst' | 'reveal' | 'count' | 'fade'>('burst')
  
  const colors = pillarColors[pillar] || pillarColors.personal_growth


  const createParticles = useCallback(() => {
    const newParticles: Particle[] = []
    const particleCount = difficulty === 'legendary' ? 150 : difficulty === 'hard' ? 100 : 60
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5
      const speed = 8 + Math.random() * 12
      const type = Math.random() > 0.7 ? 'star' : Math.random() > 0.5 ? 'sparkle' : 'confetti'
      
      newParticles.push({
        id: i,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * speed * (0.5 + Math.random()) - 5,
        size: type === 'star' ? 20 + Math.random() * 15 : 8 + Math.random() * 12,
        color: Math.random() > 0.5 ? colors.primary : colors.secondary,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
        type,
        opacity: 1
      })
    }
    
    // Add golden particles for XP
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 5 + Math.random() * 8
      newParticles.push({
        id: particleCount + i,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 6 + Math.random() * 8,
        color: '#ffd700',
        rotation: 0,
        rotationSpeed: 0,
        type: 'sparkle',
        opacity: 1
      })
    }
    
    return newParticles
  }, [colors, difficulty])

  useEffect(() => {
    if (!isVisible) {
      setParticles([])
      setShowContent(false)
      setXpCounter(0)
      setPhase('burst')
      return
    }

    // Phase 1: Particle burst
    setParticles(createParticles())
    setPhase('burst')

    // Phase 2: Reveal content
    const revealTimer = setTimeout(() => {
      setShowContent(true)
      setPhase('reveal')
    }, 300)

    // Phase 3: Count up XP
    const countTimer = setTimeout(() => {
      setPhase('count')
    }, 800)

    // Phase 4: Fade out
    const fadeTimer = setTimeout(() => {
      setPhase('fade')
    }, 3500)

    // Complete
    const completeTimer = setTimeout(() => {
      onComplete()
    }, 4500)

    return () => {
      clearTimeout(revealTimer)
      clearTimeout(countTimer)
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [isVisible, createParticles, onComplete])

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return

    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.3, // gravity
          vx: p.vx * 0.99, // friction
          rotation: p.rotation + p.rotationSpeed,
          opacity: Math.max(0, p.opacity - 0.015)
        })).filter(p => p.opacity > 0 && p.y < window.innerHeight + 100)
      )
    }, 16)

    return () => clearInterval(interval)
  }, [particles.length])

  // XP counter animation
  useEffect(() => {
    if (phase !== 'count' && phase !== 'fade') return
    
    const duration = 1500
    const startTime = Date.now()
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Easing function for smooth counting
      const eased = 1 - Math.pow(1 - progress, 3)
      setXpCounter(Math.floor(eased * xpAmount))
      
      if (progress >= 1) clearInterval(interval)
    }, 16)

    return () => clearInterval(interval)
  }, [phase, xpAmount])

  if (!isVisible) return null


  return (
    <div className={`fixed inset-0 z-[100] pointer-events-none transition-opacity duration-500 ${phase === 'fade' ? 'opacity-0' : 'opacity-100'}`}>
      {/* Dark overlay */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-500 ${showContent ? 'opacity-70' : 'opacity-0'}`}
        style={{ pointerEvents: showContent ? 'auto' : 'none' }}
      />
      
      {/* Particles */}
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        {particles.map(particle => (
          <g
            key={particle.id}
            transform={`translate(${particle.x}, ${particle.y}) rotate(${particle.rotation})`}
            opacity={particle.opacity}
          >
            {particle.type === 'confetti' && (
              <rect
                x={-particle.size / 2}
                y={-particle.size / 4}
                width={particle.size}
                height={particle.size / 2}
                fill={particle.color}
                rx={2}
              />
            )}
            {particle.type === 'star' && (
              <text
                x={0}
                y={0}
                fontSize={particle.size}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                ✦
              </text>
            )}
            {particle.type === 'sparkle' && (
              <circle
                cx={0}
                cy={0}
                r={particle.size / 2}
                fill={particle.color}
                filter="url(#glow)"
              />
            )}
          </g>
        ))}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Main content */}
      {showContent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className={`text-center transform transition-all duration-700 ${
              phase === 'reveal' || phase === 'count' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
          >
            {/* Glowing ring */}
            <div 
              className="absolute inset-0 -m-20 rounded-full animate-ping opacity-30"
              style={{ 
                background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                animationDuration: '1.5s'
              }}
            />
            
            {/* Trophy/Badge */}
            <div className="relative mb-6">
              <div 
                className="text-8xl animate-bounce"
                style={{ 
                  filter: `drop-shadow(0 0 30px ${colors.primary})`,
                  animationDuration: '0.6s'
                }}
              >
                {difficultyEmojis[difficulty] || '⭐'}
              </div>
              
              {/* Rotating stars around trophy */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <div
                    key={i}
                    className="absolute text-2xl"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `rotate(${angle}deg) translateY(-60px) rotate(-${angle}deg)`,
                      color: colors.secondary
                    }}
                  >
                    ✦
                  </div>
                ))}
              </div>
            </div>

            {/* Quest Complete text */}
            <h2 
              className="text-5xl font-black mb-4 tracking-wider"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, #ffd700)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: `0 0 40px ${colors.glow}`
              }}
            >
              QUEST COMPLETE!
            </h2>

            {/* Quest title */}
            <p className="text-xl text-white/80 mb-6 max-w-md mx-auto">
              {questTitle}
            </p>

            {/* XP Counter */}
            <div className="relative inline-block">
              <div 
                className="text-7xl font-black"
                style={{
                  color: '#ffd700',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.5)'
                }}
              >
                +{xpCounter} XP
              </div>
              
              {/* Floating +XP particles */}
              {phase === 'count' && Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute text-2xl font-bold text-yellow-400 animate-float-up"
                  style={{
                    left: `${20 + i * 15}%`,
                    animationDelay: `${i * 0.2}s`,
                    opacity: 0
                  }}
                >
                  +{Math.floor(xpAmount / 5)}
                </div>
              ))}
            </div>

            {/* Pillar badge */}
            <div 
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold uppercase tracking-wider"
              style={{ backgroundColor: colors.primary }}
            >
              <span className="text-xl">
                {pillar === 'health' && '💪'}
                {pillar === 'career' && '🎯'}
                {pillar === 'relationships' && '🤝'}
                {pillar === 'personal_growth' && '📚'}
                {pillar === 'finance' && '💰'}
                {pillar === 'recreation' && '🎮'}
              </span>
              {pillar.replace('_', ' ')}
            </div>

            {/* Difficulty banner */}
            {difficulty === 'legendary' && (
              <div className="mt-4 text-purple-400 font-bold uppercase tracking-widest animate-pulse">
                ⚡ LEGENDARY ACHIEVEMENT ⚡
              </div>
            )}
            {difficulty === 'hard' && (
              <div className="mt-4 text-orange-400 font-bold uppercase tracking-widest">
                🔥 HARD MODE CONQUERED 🔥
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen flash effect */}
      <div 
        className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-200 ${
          phase === 'burst' ? 'opacity-30' : 'opacity-0'
        }`}
      />

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 1s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
