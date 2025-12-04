'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'

interface AvatarModelProps {
  level: number
}

function AvatarModel({ level }: AvatarModelProps) {
  const { scene } = useGLTF('/models/Vengeance_Jones.glb')
  const meshRef = useRef<THREE.Group>(null)
  
  const glowIntensity = Math.min(level / 50, 1)
  const glowColor = new THREE.Color().setHSL(0.55 + glowIntensity * 0.1, 0.8, 0.5 + glowIntensity * 0.2)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
      meshRef.current.rotation.y += 0.002
    }
  })

  return (
    <group ref={meshRef}>
      <primitive object={scene} scale={1.5} position={[0, -1.5, 0]} />
      {level > 5 && (
        <pointLight color={glowColor} intensity={glowIntensity * 2} distance={3} position={[0, 0, 0]} />
      )}
    </group>
  )
}

interface Avatar3DProps {
  level?: number
  className?: string
}

export default function Avatar3D({ level = 1, className = '' }: Avatar3DProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />
          <AvatarModel level={level} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload('/models/Vengeance_Jones.glb')
