'use client'
// components/ar/ARScene.tsx
// Phase 1: overlay + 1 VCard panel. Expand once tracking is confirmed stable.

import { useState, useEffect } from 'react'
import { ARView, ARAnchor } from 'react-three-mind'
import { Html } from '@react-three/drei'
import { CARD_CONFIG, PANEL_TRANSFORMS } from '@/lib/ar-config'
import { VCard } from '@/components/modules/VCard'
import { CardOverlay } from '@/components/modules/CardOverlay'

function ARContent({ onFound, onLost }: { onFound: () => void; onLost: () => void }) {
  return (
    <ARAnchor target={0} onAnchorFound={onFound} onAnchorLost={onLost}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />

      {/* Overlay — sits flat on card surface */}
      <Html
        transform
        occlude={false}
        position={PANEL_TRANSFORMS.overlay.position}
        rotation={PANEL_TRANSFORMS.overlay.rotation}
        style={{ pointerEvents: 'none' }}
      >
        <CardOverlay />
      </Html>

      {/* VCard panel — floats above card */}
      <Html
        transform
        occlude={false}
        position={PANEL_TRANSFORMS.top.position}
        rotation={PANEL_TRANSFORMS.top.rotation}
      >
        <div style={{
          width: 180,
          background: 'rgba(8,8,20,0.9)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.15)',
          overflow: 'hidden',
          padding: 10,
          boxSizing: 'border-box',
          fontFamily: 'system-ui, sans-serif',
          color: '#fff',
        }}>
          <VCard />
        </div>
      </Html>
    </ARAnchor>
  )
}

export function ARScene() {
  const [tracking, setTracking] = useState(false)
  const [ready, setReady] = useState(false)
  const [arError, setArError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setArError('Camera API not available — requires HTTPS.')
    }
  }, [])

  if (arError) throw new Error(arError)

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
