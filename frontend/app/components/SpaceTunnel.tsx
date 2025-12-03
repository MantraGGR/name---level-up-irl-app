'use client'

import { useEffect, useState, useRef } from 'react'

interface SpaceTunnelProps {
  onComplete?: () => void
  duration?: number
  username?: string
  isNewUser?: boolean
}

export default function SpaceTunnel({ onComplete, duration = 4500, username, isNewUser = false }: SpaceTunnelProps) {
  const [phase, setPhase] = useState<'intro' | 'transition' | 'done'>('intro')
  const [textVisible, setTextVisible] = useState(false)
  const nameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Show text after a brief delay
    const textTimer = setTimeout(() => setTextVisible(true), 300)
    
    // Start transition phase (background fades, name moves)
    const transitionTimer = setTimeout(() => setPhase('transition'), duration - 2000)

    // Complete and unmount
    const completeTimer = setTimeout(() => {
      setPhase('done')
      onComplete?.()
    }, duration)

    return () => {
      clearTimeout(textTimer)
      clearTimeout(transitionTimer)
      clearTimeout(completeTimer)
    }
  }, [duration, onComplete])

  // Calculate target position for name animation
  const getNameStyle = () => {
    if (phase === 'intro') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 'clamp(2rem, 8vw, 4rem)',
        opacity: textVisible ? 1 : 0,
      }
    } else {
      // Animate to player card position
      return {
        position: 'fixed' as const,
        top: '180px',
        left: '50%',
        transform: 'translate(-50%, 0) scale(0.6)',
        fontSize: 'clamp(2rem, 8vw, 4rem)',
        opacity: phase === 'done' ? 0 : 1,
      }
    }
  }

  return (
    <div className={`fixed inset-0 z-50 ${phase === 'done' ? 'pointer-events-none' : ''}`}>
      {/* Background layer - fades out */}
      <div 
        className="absolute inset-0 transition-opacity"
        style={{ 
          background: 'radial-gradient(ellipse at center, #0a1628 0%, #000 100%)',
          transitionDuration: '1500ms',
          transitionTimingFunction: 'ease-out',
          opacity: phase === 'intro' ? 1 : 0,
        }}
      >
        {/* Starfield background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                opacity: Math.random() * 0.8 + 0.2,
                animation: `twinkle ${Math.random() * 2 + 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Space tunnel scene */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ perspective: '300px' }}>
          <div className="relative w-screen h-screen" style={{ transformStyle: 'preserve-3d' }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 rounded-full"
                style={{
                  width: '200vmax',
                  height: '200vmax',
                  marginLeft: '-100vmax',
                  marginTop: '-100vmax',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.2), inset 0 0 30px rgba(139, 92, 246, 0.1)',
                  animation: `tunnelMove 3s linear infinite`,
                  animationDelay: `${i * 0.75}s`,
                  opacity: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Speed lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 bg-gradient-to-b from-transparent via-blue-500/80 to-transparent"
              style={{
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                height: '0px',
                animation: `speedLine 1.5s linear infinite`,
                animationDelay: `${Math.random() * 2}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>

        {/* Vignette overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.8) 100%)'
          }}
        />
      </div>

      {/* Welcome text - fades out with background */}
      <div 
        className="absolute inset-0 flex items-center justify-center z-10 transition-opacity"
        style={{
          transitionDuration: '800ms',
          opacity: phase === 'intro' && textVisible ? 1 : 0,
        }}
      >
        <div className="text-center -mt-20">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 scale-150"></div>
            <h1 
              className="relative font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 tracking-wider"
              style={{ 
                fontSize: 'clamp(1.5rem, 6vw, 3.5rem)',
                animation: 'textGlow 2s ease-in-out infinite alternate'
              }}
            >
              {isNewUser ? 'WELCOME' : 'WELCOME BACK'}
            </h1>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-500"></div>
            <p className="text-gray-400 uppercase tracking-[0.4em] text-sm font-light">
              Initializing
            </p>
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-500"></div>
          </div>
        </div>
      </div>

      {/* Username - animates from center to player card position */}
      {username && (
        <div 
          ref={nameRef}
          className="font-black text-white z-20 whitespace-nowrap transition-all"
          style={{
            ...getNameStyle(),
            transitionDuration: '1500ms',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            textShadow: phase === 'intro' ? '0 0 40px rgba(59, 130, 246, 0.8)' : 'none',
          }}
        >
          {username}
        </div>
      )}

      <style jsx global>{`
        @keyframes tunnelMove {
          0% {
            transform: translateZ(-1000px) scale(0.1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateZ(300px) scale(3);
            opacity: 0;
          }
        }

        @keyframes speedLine {
          0% {
            height: 0;
            opacity: 0;
          }
          50% {
            height: 100px;
            opacity: 1;
          }
          100% {
            height: 0;
            opacity: 0;
            transform: translateY(200px);
          }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes textGlow {
          from {
            filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.5));
          }
          to {
            filter: drop-shadow(0 0 40px rgba(139, 92, 246, 0.8));
          }
        }
      `}</style>
    </div>
  )
}
