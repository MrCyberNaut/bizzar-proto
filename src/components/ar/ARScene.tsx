'use client'
// components/ar/ARScene.tsx
// MindAR manages camera + image tracking.
// R3F Canvas transparent overlay — anchor.group passed directly to CardAnchor (no Zustand lag).

import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useARStore } from '@/store/ar-store'
import { CardAnchor } from './CardAnchor'
import { CARD_CONFIG } from '@/lib/ar-config'

interface MindARInstance {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  start: () => Promise<void>
  stop: () => void
  addAnchor: (index: number) => {
    group: THREE.Group
    onTargetFound?: () => void
    onTargetLost?: () => void
  }
}

function CameraSync({ mindarCamera }: { mindarCamera: THREE.PerspectiveCamera | null }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.matrixAutoUpdate = false
    ;(camera as any).matrixWorldAutoUpdate = false
    return () => {
      camera.matrixAutoUpdate = true
      ;(camera as any).matrixWorldAutoUpdate = true
    }
  }, [camera])

  useFrame(() => {
    if (!mindarCamera) return
    camera.projectionMatrix.copy(mindarCamera.projectionMatrix)
    camera.projectionMatrixInverse.copy(mindarCamera.projectionMatrixInverse)
    camera.matrixWorld.copy(mindarCamera.matrixWorld)
    camera.matrixWorldInverse.copy(mindarCamera.matrixWorldInverse)
    camera.matrixWorldNeedsUpdate = false
  })
  return null
}

export function ARScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [tracking, setTracking] = useState(false)
  const [ready, setReady] = useState(false)
  const [mindarCamera, setMindarCamera] = useState<THREE.PerspectiveCamera | null>(null)
  // Pass anchor.group directly — no Zustand roundtrip, no frame lag
  const anchorGroupRef = useRef<THREE.Group | null>(null)
  const mindarRef = useRef<MindARInstance | null>(null)
  const { setLost } = useARStore()

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    const run = async () => {
      try {
        await import('mind-ar/dist/mindar-image-three.prod.js')
        const MindARThree = (window as any).MINDAR?.IMAGE?.MindARThree
        if (!MindARThree) throw new Error('MindAR bundle did not expose window.MINDAR.IMAGE.MindARThree')
        if (cancelled || !containerRef.current) return

        const mindar: MindARInstance = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: CARD_CONFIG.mindFile,
          uiLoading: 'no',
          uiScanning: 'no',
          uiError: 'no',
        })
        mindarRef.current = mindar

        const anchor = mindar.addAnchor(0)
        anchorGroupRef.current = anchor.group

        anchor.onTargetFound = () => { if (!cancelled) setTracking(true) }
        anchor.onTargetLost = () => {
          if (!cancelled) {
            setLost()
            setTracking(false)
          }
        }

        // MindAR drives its own renderer; R3F runs independently via frameloop="always"
        mindar.renderer.setAnimationLoop(() => {
          mindar.renderer.render(mindar.scene, mindar.camera)
        })

        await mindar.start()
        if (!cancelled) {
          setMindarCamera(mindar.camera)
          setReady(true)
        }
      } catch (err) {
        if (!cancelled) setError(`AR failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    run()
    return () => {
      cancelled = true
      mindarRef.current?.stop()
    }
  }, [])

  if (error) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0a0a0a',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px', textAlign: 'center', fontFamily: 'system-ui', color: '#fff', gap: '12px',
      }}>
        <div style={{ fontSize: '32px' }}>⚠️</div>
        <div style={{ fontSize: '16px', fontWeight: '600' }}>AR Failed to Start</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', maxWidth: '320px' }}>{error}</div>
      </div>
    )
  }

  return (
    <>
      <div ref={containerRef} style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

      <Canvas
        style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'transparent', pointerEvents: 'none' }}
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: 75, near: 0.01, far: 100000 }}
        frameloop="always"
      >
        <CameraSync mindarCamera={mindarCamera} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <pointLight position={[-3, 5, -3]} intensity={0.5} color="#6366f1" />
        <CardAnchor anchorGroup={anchorGroupRef} />
      </Canvas>

      <div style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}>
        {!tracking && ready && (
          <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '100px', padding: '10px 20px', color: '#fff', fontSize: '14px', fontWeight: '500', fontFamily: 'system-ui', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', animation: 'pulse 1.5s infinite' }} />
            Point camera at your business card
          </div>
        )}
        {tracking && (
          <div style={{ background: 'rgba(34,197,94,0.2)', backdropFilter: 'blur(12px)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: '100px', padding: '10px 20px', color: '#4ade80', fontSize: '14px', fontWeight: '600', fontFamily: 'system-ui', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }} />
            Card detected
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 10, pointerEvents: 'none', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)', fontFamily: 'system-ui' }}>
        Made with BizzAR
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </>
  )
}
