'use client'
// components/ar/ARScene.tsx
// MindAR handles image tracking. CSS3DRenderer renders HTML panels as CSS3DObjects
// parented directly to anchor.group — single animation loop, zero sync issues.

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — three/examples/jsm path resolution varies by bundler
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { CARD_CONFIG, PANEL_TRANSFORMS } from '@/lib/ar-config'
import { VCard } from '@/components/modules/VCard'
import { Bio } from '@/components/modules/Bio'
import { Socials } from '@/components/modules/Socials'
import { GitHubGraph } from '@/components/modules/GitHubGraph'
import { ImageGallery } from '@/components/modules/ImageGallery'
import { VideoPanel } from '@/components/modules/VideoPanel'
import { CardOverlay } from '@/components/modules/CardOverlay'

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

function makePanelDiv(width: number, height: number): HTMLDivElement {
  const div = document.createElement('div')
  Object.assign(div.style, {
    width: `${width}px`,
    height: `${height}px`,
    background: 'rgba(8, 8, 20, 0.82)',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.13)',
    overflow: 'hidden',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, sans-serif',
    color: '#fff',
  })
  return div
}

export function ARScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [tracking, setTracking] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false
    const cssRoots: Root[] = []
    let cssRendererEl: HTMLElement | null = null
    let mindar: MindARInstance | null = null

    const run = async () => {
      try {
        await import('mind-ar/dist/mindar-image-three.prod.js')
        const MindARThree = (window as any).MINDAR?.IMAGE?.MindARThree
        if (!MindARThree) throw new Error('MindAR bundle did not expose window.MINDAR.IMAGE.MindARThree')
        if (cancelled || !containerRef.current) return

        mindar = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: CARD_CONFIG.mindFile,
          uiLoading: 'no',
          uiScanning: 'no',
          uiError: 'no',
        }) as MindARInstance

        // Lights into MindAR's scene
        mindar.scene.add(new THREE.AmbientLight(0xffffff, 0.8))
        const dir = new THREE.DirectionalLight(0xffffff, 1.2)
        dir.position.set(5, 10, 5)
        mindar.scene.add(dir)
        mindar.scene.add(new THREE.PointLight(0x6366f1, 0.5).position.set(-3, 5, -3) && new THREE.PointLight(0x6366f1, 0.5))

        // CSS3DRenderer — overlays on top of MindAR's WebGL canvas
        const cssRenderer = new CSS3DRenderer()
        cssRenderer.setSize(window.innerWidth, window.innerHeight)
        Object.assign(cssRenderer.domElement.style, {
          position: 'fixed',
          top: '0',
          left: '0',
          pointerEvents: 'none',
          zIndex: '2',
        })
        document.body.appendChild(cssRenderer.domElement)
        cssRendererEl = cssRenderer.domElement

        const anchor = mindar.addAnchor(0)

        // Helper: create a CSS3DObject panel, add to anchor.group, render React into it
        const addPanel = (
          slot: keyof typeof PANEL_TRANSFORMS,
          width: number,
          height: number,
          content: React.ReactElement,
        ) => {
          const div = makePanelDiv(width, height)
          const obj = new CSS3DObject(div)
          const t = PANEL_TRANSFORMS[slot]
          obj.position.set(...t.position)
          obj.rotation.set(...t.rotation)
          anchor.group.add(obj)
          const root = createRoot(div)
          root.render(content)
          cssRoots.push(root)
        }

        addPanel('overlay', 700, 440, <CardOverlay />)

        addPanel('top', 400, 300,
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%', padding: '10px' }}>
            <div style={{ flex: '0 0 54%' }}><VCard /></div>
            <div style={{ flex: '1 1 0' }}><Bio /></div>
          </div>
        )

        addPanel('left', 320, 380,
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%', padding: '10px' }}>
            <div style={{ flex: '0 0 40%' }}><Socials /></div>
            <div style={{ flex: '1 1 0' }}><GitHubGraph /></div>
          </div>
        )

        addPanel('right', 320, 380,
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%', padding: '10px' }}>
            <div style={{ flex: '0 0 48%' }}><ImageGallery /></div>
            <div style={{ flex: '1 1 0' }}><VideoPanel /></div>
          </div>
        )

        // Floating icosahedron — plain Three.js mesh, no R3F needed
        const gem = new THREE.Mesh(
          new THREE.IcosahedronGeometry(35, 0),
          new THREE.MeshStandardMaterial({
            color: '#6366f1',
            metalness: 0.8,
            roughness: 0.15,
            emissive: '#2d2f7e',
            emissiveIntensity: 0.4,
          })
        )
        gem.position.set(0, 0, 300)
        anchor.group.add(gem)

        anchor.onTargetFound = () => { if (!cancelled) setTracking(true) }
        anchor.onTargetLost = () => { if (!cancelled) setTracking(false) }

        // Single animation loop — both renderers, same camera
        mindar.renderer.setAnimationLoop((time: number) => {
          gem.rotation.y = (time / 1000) * 0.6
          gem.rotation.x = Math.sin(time / 2000) * 0.3
          mindar!.renderer.render(mindar!.scene, mindar!.camera)
          cssRenderer.render(mindar!.scene, mindar!.camera)
        })

        await mindar.start()
        if (!cancelled) setReady(true)

      } catch (err) {
        if (!cancelled) setError(`AR failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    run()
    return () => {
      cancelled = true
      cssRoots.forEach(r => r.unmount())
      if (cssRendererEl && document.body.contains(cssRendererEl)) {
        document.body.removeChild(cssRendererEl)
      }
      mindar?.stop()
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
