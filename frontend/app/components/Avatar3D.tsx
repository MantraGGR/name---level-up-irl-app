'use client'

import { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface AvatarModelProps {
  level: number
}

function AvatarModel({ level }: AvatarModelProps) {
  const gltf = useGLTF('/models/low_poly_soldier_free.glb')
  const groupRef = useRef<THREE.Group>(null)
  const { gl } = useThree()
  const [materialsFixed, setMaterialsFixed] = useState(false)
  
  // Fix color space and materials
  useEffect(() => {
    gl.outputColorSpace = THREE.SRGBColorSpace
    
    if (gltf.scene && !materialsFixed) {
      console.log('Processing GLB model...')
      
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
          
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          
          materials.forEach((mat, idx) => {
            console.log(`Material ${idx}:`, mat.type, mat)
            
            // Handle different material types
            if (mat instanceof THREE.MeshStandardMaterial) {
              // Fix color space for all textures
              const textures = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap']
              textures.forEach(texName => {
                const tex = (mat as any)[texName]
                if (tex) {
                  if (texName === 'map' || texName === 'emissiveMap') {
                    tex.colorSpace = THREE.SRGBColorSpace
                  }
                  tex.needsUpdate = true
                }
              })
              
              // Ensure material is visible
              mat.side = THREE.DoubleSide
              mat.needsUpdate = true
            } 
            else if (mat instanceof THREE.MeshBasicMaterial) {
              if (mat.map) {
                mat.map.colorSpace = THREE.SRGBColorSpace
                mat.map.needsUpdate = true
              }
              mat.side = THREE.DoubleSide
              mat.needsUpdate = true
            }
            // If material has no color/texture, give it a default
            else if (mat.type === 'MeshStandardMaterial' || mat.type === 'MeshPhysicalMaterial') {
              const stdMat = mat as THREE.MeshStandardMaterial
              if (!stdMat.map && stdMat.color.getHex() === 0xffffff) {
                // Model has white material with no texture - give it a color
                stdMat.color.setHex(0x6688cc)
                stdMat.metalness = 0.3
                stdMat.roughness = 0.6
              }
              stdMat.needsUpdate = true
            }
          })
        }
      })
      
      setMaterialsFixed(true)
    }
  }, [gltf, gl, materialsFixed])
  
  // Animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
      groupRef.current.rotation.y += 0.003
    }
  })

  const glowIntensity = Math.min(level / 50, 1)

  return (
    <group ref={groupRef}>
      <primitive 
        object={gltf.scene} 
        scale={0.02}
        position={[0, -1, 0]}
      />
      {level > 5 && (
        <pointLight
          color="#66aaff"
          intensity={glowIntensity * 2}
          distance={5}
          position={[0, 1, 2]}
        />
      )}
    </group>
  )
}

function LoadingFallback() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh ref={meshRef}>
      <capsuleGeometry args={[0.4, 1, 8, 16]} />
      <meshStandardMaterial color="#4a9eff" metalness={0.5} roughness={0.3} />
    </mesh>
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
        camera={{ position: [0, 1, 8], fov: 45 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
        }}
        style={{ background: 'transparent' }}
      >
        {/* Strong lighting to see the model */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 10, 7]} intensity={2} />
        <directionalLight position={[-5, 5, -5]} intensity={1} color="#aaccff" />
        <pointLight position={[0, 5, 0]} intensity={1} />
        <hemisphereLight intensity={0.8} groundColor="#333333" />
        
        <Suspense fallback={<LoadingFallback />}>
          <AvatarModel level={level} />
        </Suspense>
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/models/low_poly_soldier_free.glb')
