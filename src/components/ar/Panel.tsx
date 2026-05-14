'use client'
// components/ar/Panel.tsx
// An R3F plane with a Drei <Html> overlay for module content

import { useRef } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface PanelProps {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  children: React.ReactNode
  width?: number
  height?: number
  interactive?: boolean
  opacity?: number
}

export function Panel({ position, rotation, scale, children, width = 280, height = 180, interactive = true, opacity = 0.45 }: PanelProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  return (
    <group position={position} rotation={rotation}>
      {/* The 3D plane — semi-transparent glass backing */}
      <mesh ref={meshRef} scale={scale}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#111111"
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Html content overlay positioned at same location */}
      <Html
        transform
        occlude={false}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: interactive ? 'auto' : 'none',
        }}
        position={[0, 0, 0.01]}
      >
        <div style={{ width: '100%', height: '100%' }}>
          {children}
        </div>
      </Html>
    </group>
  )
}
