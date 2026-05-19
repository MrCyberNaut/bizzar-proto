'use client'
// components/ar/ARScene.tsx
// Pure R3F meshes — scales naturally in MindAR 1-unit space.
// Card = 1 unit wide × 0.635 unit tall (85mm × 54mm).

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { ARView, ARAnchor } from 'react-three-mind'
import { useTexture, Text, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CARD_CONFIG } from '@/lib/ar-config'
import { downloadVCF } from '@/lib/vcf'

// ── Glowing border overlay on card surface ───────────────────────────────────
function CardFrame() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.06 + Math.abs(Math.sin(clock.getElapsedTime() * 1.5)) * 0.12
  })
  return (
    <mesh ref={ref} position={[0, 0, 0.001]}>
      <planeGeometry args={[1.0, 0.635]} />
      <meshBasicMaterial color="#818cf8" transparent opacity={0.08} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ── Contact card: photo texture + Add to Contacts button ─────────────────────
function ContactCard() {
  const texture = useTexture(CARD_CONFIG.cardImage)
  const [saved, setSaved] = useState(false)
  const { owner } = CARD_CONFIG

  const W = 0.7
  const H = W * 0.625

  return (
    <group position={[0, 0.82, 0.05]}>
      {/* Photo plane */}
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      {/* Button */}
      <group
        position={[0, -(H / 2 + 0.08), 0.01]}
        onClick={() => { downloadVCF(owner); setSaved(true); setTimeout(() => setSaved(false), 2500) }}
      >
        <RoundedBox args={[0.44, 0.1, 0.008]} radius={0.012} smoothness={4}>
          <meshBasicMaterial color={saved ? '#16a34a' : '#6366f1'} />
        </RoundedBox>
        <Text position={[0, 0, 0.01]} fontSize={0.035} color="#ffffff" anchorX="center" anchorY="middle">
          {saved ? '✓  Saved!' : '+  Add to Contacts'}
        </Text>
      </group>
    </group>
  )
}

// ── Anchor content — callbacks via refs to avoid closure-stale re-renders ────
function ARContent({
  onFound,
  onLost,
}: {
  onFound: () => void
  onLost: () => void
}) {
  return (
    <ARAnchor target={0} onAnchorFound={onFound} onAnchorLost={onLost}>
      <ambientLight intensity={1.2} />
      <CardFrame />
      <Suspense fallback={null}>
        <ContactCard />
      </Suspense>
    </ARAnchor>
  )
}

// ── Scene root ────────────────────────────────────────────────────────────────
export function ARScene() {
  // Only HUD state drives re-renders of the outer shell — ARView is unaffected.
  const [tracking, setTracking] = useState(false)
  const [ready, setReady] = useState(false)

  // Stable callbacks so ARContent never re-renders due to new function refs.
  const handleFound = useCallback(() => setTracking(true), [])
  const handleLost = useCallback(() => setTracking(false), [])

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
        onReady={() => setReady(true)}
        onError={(e: unknown) => console.warn('[ARView error]', e)}
        // ── Tracking quality tuning ──────────────────────────────────────────
        // One Euro Filter: lower minCF = smoother pose, lower beta = less
        // speed-dependent lag on slow / stationary targets like a desk card.
        filterMinCF={0.0001}
        filterBeta={5000}
        missTolerance={25}
        warmupTolerance={2}
        // Only track 1 image target — halves CPU work on single-card use case.
        maxTrack={1}
        // Cap device pixel ratio to 1.5 — 3× DPR on Android triples render cost.
        dpr={[1, 1.5]}
      >
        <ARContent onFound={handleFound} onLost={handleLost} />
      </ARView>

      {/* HUD is outside ARView — state changes here never trigger Canvas re-renders */}
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
