'use client'
// components/ar/CardAnchor.tsx
// Copies anchor.group.matrixWorld each frame — direct ref, no Zustand lag.

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

interface Props {
  anchorGroup: React.RefObject<THREE.Group | null>
}

export function CardAnchor({ anchorGroup }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const { isTracking } = useARStore()

  useFrame(() => {
    const src = anchorGroup.current
    const dst = groupRef.current
    if (!src || !dst) return
    // Copy full world matrix directly — includes position, rotation, scale
    dst.matrixAutoUpdate = false
    dst.matrix.copy(src.matrixWorld)
    dst.matrixWorldNeedsUpdate = true
  })

  if (!isTracking) return null

  return (
    <group ref={groupRef}>

      {/* ── OVERLAY ── flat on card surface */}
      <Panel
        position={PANEL_TRANSFORMS.overlay.position}
        rotation={PANEL_TRANSFORMS.overlay.rotation}
        scale={[550, 345, 1]}
        width={550}
        height={345}
        interactive={false}
        opacity={0}
      >
        <CardOverlay />
      </Panel>

      {/* ── TOP ── VCard + Bio */}
      <Panel
        position={PANEL_TRANSFORMS.top.position}
        rotation={PANEL_TRANSFORMS.top.rotation}
        scale={[400, 300, 1]}
        width={400}
        height={300}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%' }}>
          <div style={{ flex: '0 0 54%' }}><VCard /></div>
          <div style={{ flex: '1 1 0' }}><Bio /></div>
        </div>
      </Panel>

      {/* ── LEFT ── Socials + GitHub */}
      <Panel
        position={PANEL_TRANSFORMS.left.position}
        rotation={PANEL_TRANSFORMS.left.rotation}
        scale={[320, 380, 1]}
        width={320}
        height={380}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%' }}>
          <div style={{ flex: '0 0 40%' }}><Socials /></div>
          <div style={{ flex: '1 1 0' }}><GitHubGraph /></div>
        </div>
      </Panel>

      {/* ── RIGHT ── Gallery + Video */}
      <Panel
        position={PANEL_TRANSFORMS.right.position}
        rotation={PANEL_TRANSFORMS.right.rotation}
        scale={[320, 380, 1]}
        width={320}
        height={380}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%' }}>
          <div style={{ flex: '0 0 48%' }}><ImageGallery /></div>
          <div style={{ flex: '1 1 0' }}><VideoPanel /></div>
        </div>
      </Panel>

      <Model3D />

    </group>
  )
}
