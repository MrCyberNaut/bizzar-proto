'use client'
// components/ar/CardAnchor.tsx
// R3F group anchored to the detected card. 4 panels: overlay + top + left + right.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useARStore } from '@/store/ar-store'
import { PANEL_TRANSFORMS } from '@/lib/ar-config'
import { Panel } from './Panel'
import { VCard } from '@/components/modules/VCard'
import { Bio } from '@/components/modules/Bio'
import { Socials } from '@/components/modules/Socials'
import { GitHubGraph } from '@/components/modules/GitHubGraph'
import { ImageGallery } from '@/components/modules/ImageGallery'
import { VideoPanel } from '@/components/modules/VideoPanel'
import { CardOverlay } from '@/components/modules/CardOverlay'
import { Model3D } from '@/components/modules/Model3D'

export function CardAnchor() {
  const groupRef = useRef<THREE.Group>(null)
  const { isTracking, transform } = useARStore()

  useFrame(() => {
    if (!groupRef.current || !transform) return
    const { position, rotation } = transform
    groupRef.current.position.set(position.x, position.y, position.z)
    groupRef.current.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
  })

  if (!isTracking) return null

  return (
    <group ref={groupRef}>

      {/* DEBUG: yellow sphere 380 units above anchor — verifies Y-up scale; remove after calibration */}
      <mesh position={[0, 380, 0]}>
        <sphereGeometry args={[25, 8, 8]} />
        <meshBasicMaterial color="yellow" />
      </mesh>

      {/* ── OVERLAY ── flat on card surface: animated shimmer frame */}
      <Panel
        position={PANEL_TRANSFORMS.overlay.position}
        rotation={PANEL_TRANSFORMS.overlay.rotation}
        scale={PANEL_TRANSFORMS.overlay.scale}
        width={320}
        height={190}
        interactive={false}
        opacity={0}
      >
        <CardOverlay />
      </Panel>

      {/* ── TOP ── VCard (contact save) + Bio */}
      <Panel
        position={PANEL_TRANSFORMS.top.position}
        rotation={PANEL_TRANSFORMS.top.rotation}
        scale={PANEL_TRANSFORMS.top.scale}
        width={300}
        height={220}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%' }}>
          <div style={{ flex: '0 0 54%' }}><VCard /></div>
          <div style={{ flex: '1 1 0' }}><Bio /></div>
        </div>
      </Panel>

      {/* ── LEFT ── Socials (SVG icons) + GitHub contributions */}
      <Panel
        position={PANEL_TRANSFORMS.left.position}
        rotation={PANEL_TRANSFORMS.left.rotation}
        scale={PANEL_TRANSFORMS.left.scale}
        width={230}
        height={260}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%' }}>
          <div style={{ flex: '0 0 42%' }}><Socials /></div>
          <div style={{ flex: '1 1 0' }}><GitHubGraph /></div>
        </div>
      </Panel>

      {/* ── RIGHT ── Image Gallery (tap to expand) + Video (tap to play) */}
      <Panel
        position={PANEL_TRANSFORMS.right.position}
        rotation={PANEL_TRANSFORMS.right.rotation}
        scale={PANEL_TRANSFORMS.right.scale}
        width={230}
        height={260}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%' }}>
          <div style={{ flex: '0 0 48%' }}><ImageGallery /></div>
          <div style={{ flex: '1 1 0' }}><VideoPanel /></div>
        </div>
      </Panel>

      {/* ── 3D MODEL ── floating icosahedron (native R3F mesh, not Html) */}
      <Model3D />

    </group>
  )
}
