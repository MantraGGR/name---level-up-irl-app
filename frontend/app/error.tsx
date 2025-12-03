'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10 max-w-md mx-auto px-4"
      >
        <div className="text-8xl mb-6">💥</div>
        
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-4">
          SYSTEM ERROR
        </h1>
        
        <p className="text-gray-400 mb-2">
          Something went wrong. Don't worry, your progress is safe.
        </p>
        
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 mb-8 text-left">
          <p className="text-red-400 text-sm font-mono break-all">
            {error.message || 'An unexpected error occurred'}
          </p>
          {error.digest && (
            <p className="text-gray-600 text-xs mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-red-500/30"
          >
            Try Again
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/'}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all border border-gray-700"
          >
            Go Home
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
