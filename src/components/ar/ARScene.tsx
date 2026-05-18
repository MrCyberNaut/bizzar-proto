'use client'
// components/ar/ARScene.tsx
// Phase 1: pure R3F meshes — no Html, scales naturally in MindAR 1-unit coordinate space.
// Card = 1 unit wide × 0.635 unit tall (85mm × 54mm aspect).

import { useState, useEffect, useRef } from 'react'
import { ARView, ARAnchor } from 'react-three-mind'
import { useTexture, Text, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CARD_CONFIG } from '@/lib/ar-config'
import { downloadVCF } from '@/lib/vcf'

// ── Overlay: glowing border frame on the card surface ───────────────────────
function CardFrame() {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.4 + Math.sin(clock.getElapsedTime() * 2) * 0.2
    }
  })
  return (
    <group position={[0, 0, 0.001]}>
      {/* card outline */}
      <mesh ref={meshRef}>
        <planeGeometry args={[1.0, 0.635]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      {/* border edges via line segments */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(1.0, 0.635)]} />
        <lineBasicMaterial color="#818cf8" transparent opacity={0.7} />
      </lineSegments>
    </group>
  )
}

// ── Contact card: photo + Add to Contacts ────────────────────────────────────
function ContactCard() {
  const texture = useTexture(CARD_CONFIG.cardImage)
  const [saved, setSaved] = useState(false)
  const { owner } = CARD_CONFIG

  const handleSave = () => {
    downloadVCF(owner)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Card photo panel — 0.7 wide, aspect ratio 16:10
  const W = 0.7
  const H = W * 0.625

  return (
    <group position={[0, 0.85, 0.05]}>
      {/* Photo */}
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      {/* "Add to Contacts" button */}
      <group position={[0, -(H / 2 + 0.07), 0]} onClick={handleSave}>
        <RoundedBox args={[0.42, 0.1, 0.01]} radius={0.015} smoothness={4}>
          <meshBasicMaterial color={saved ? '#22c55e' : '#6366f1'} />
        </RoundedBox>
        <Text
          position={[0, 0, 0.012]}
          fontSize={0.038}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {saved ? '✓  Saved to Contacts' : '＋  Add to Contacts'}
        </Text>
      </group>
    </group>
  )
}

// ── Anchor content ────────────────────────────────────────────────────────────
function ARContent({ onFound, onLost }: { onFound: () => void; onLost: () => void }) {
  return (
    <ARAnchor target={0} onAnchorFound={onFound} onAnchorLost={onLost}>
      <ambientLight intensity={1.0} />
      <CardFrame />
      <ContactCard />
    </ARAnchor>
  )
}

// ── Scene root ────────────────────────────────────────────────────────────────
export function ARScene() {
  const [tracking, setTracking] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera API unavailable — open via HTTPS.')
    }
  }, [])

  return (
    <>
      <ARView
        imageTargets={CARD_CONFIG.mindFile}
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        flipUserCamera={false}
        onReady={() => setReady(true)}
        onError={(e: unknown) => { throw new Error(String(e)) }}
        filterMinCF={0.001}
        filterBeta={1000}
        missTolerance={5}
        warmupTolerance={3}
      >
        <ARContent onFound={() => setTracking(true)} onLost={() => setTracking(false)} />
      </ARView>

      {/* HUD */}
      <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}>
        {!tracking && ready && (
          <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 500, fontFamily: 'system-ui', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', animation: 'pulse 1.5s infinite' }} />
            Point camera at your business card
          </div>
        )}
        {tracking && (
          <div style={{ background: 'rgba(34,197,94,0.2)', backdropFilter: 'blur(12px)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 100, padding: '10px 20px', color: '#4ade80', fontSize: 14, fontWeight: 600, fontFamily: 'system-ui', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
            Card detected
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 10, pointerEvents: 'none', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)', fontFamily: 'system-ui' }}>
        Made with BizzAR
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </>
  )
}
