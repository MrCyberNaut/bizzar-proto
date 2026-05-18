'use client'
// components/modules/Model3D.tsx
// This is the ONLY module that renders as a native R3F mesh (not an Html overlay)
// It floats beside the card in 3D space

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { CARD_CONFIG, PANEL_TRANSFORMS } from '@/lib/ar-config'

export function Model3D() {
  const ref = useRef<THREE.Group>(null)

  let scene: THREE.Group | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const gltf = useGLTF(CARD_CONFIG.model3d)
    scene = gltf.scene as THREE.Group
  } catch {
    // .glb not provided — render placeholder sphere
  }

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.4
    }
  })

  return (
    <group
      ref={ref}
      position={PANEL_TRANSFORMS.model.position}
      scale={[0.8, 0.8, 0.8]}
    >
      {scene ? (
        <primitive object={scene.clone()} />
      ) : (
        // Fallback: glowing icosahedron if no .glb provided
        <mesh>
          <icosahedronGeometry args={[0.5, 1]} />
          <meshStandardMaterial
            color="#6366f1"
            emissive="#4338ca"
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
            wireframe={false}
          />
        </mesh>
      )}
    </group>
  )
}
