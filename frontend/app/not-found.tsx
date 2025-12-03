'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-500/30 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)
            }}
            animate={{ 
              y: [null, -20, 20],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10 max-w-md mx-auto px-4"
      >
        <motion.div 
          className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4"
          animate={{ 
            textShadow: [
              "0 0 20px rgba(168, 85, 247, 0.5)",
              "0 0 40px rgba(168, 85, 247, 0.8)",
              "0 0 20px rgba(168, 85, 247, 0.5)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          404
        </motion.div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          LOCATION NOT FOUND
        </h1>
        
        <p className="text-gray-400 mb-8">
          This area hasn't been unlocked yet. Return to base and continue your journey.
        </p>

        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-purple-500/30"
          >
            Return to Base →
          </motion.button>
        </Link>
      </motion.div>
    </div>
  )
}
