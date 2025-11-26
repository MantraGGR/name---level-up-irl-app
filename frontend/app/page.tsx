'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      router.push('/dashboard')
    }
  }, [router])

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8000/auth/google/login'
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 relative overflow-hidden">
      {/* Atmospheric background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      
      <div className="z-10 max-w-5xl w-full items-center justify-center relative">
        <div className="text-center">
          {/* Epic title with glow */}
          <div className="mb-8">
            <h1 className="text-8xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 glow-text tracking-tight">
              TAKEOFF
            </h1>
            <div className="h-1 w-48 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          </div>
          
          <p className="text-2xl mb-4 text-gray-300 font-light tracking-wide">
            Ascend Beyond Your Limits
          </p>
          <p className="text-sm mb-12 text-gray-500 uppercase tracking-widest">
            An RPG System for Real Life
          </p>
          
          {/* Epic button */}
          <button
            onClick={handleGoogleLogin}
            className="group relative bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-12 rounded-lg text-lg transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 border border-blue-400/30 glow-border"
          >
            <span className="relative z-10">Begin Your Journey</span>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          <p className="mt-8 text-xs text-gray-600 uppercase tracking-wider">
            Sign in with Google to start
          </p>
        </div>
      </div>
    </main>
  )
}
