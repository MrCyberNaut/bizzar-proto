'use client'
// components/ar/Panel.tsx

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

export function Panel({ position, rotation, scale, children, width = 320, height = 300, interactive = true, opacity = 0.45 }: PanelProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef} scale={scale}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color="#0a0a14" transparent opacity={opacity} side={THREE.DoubleSide} />
      </mesh>

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
        <div style={{
          width: '100%', height: '100%',
          background: 'rgba(8,8,20,0.82)',
          borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.13)',
          overflow: 'hidden',
          boxSizing: 'border-box',
          padding: '10px',
          fontFamily: 'system-ui, sans-serif',
          color: '#fff',
        }}>
          {children}
        </div>
      </Html>
    </group>
  )
}
