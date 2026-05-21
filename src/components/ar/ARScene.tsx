'use client'
// ARScene.tsx — DEBUG BUILD
// Layout: AR viewport top 58vh · debug panel bottom 42vh
// Callbacks: all useCallback so ARView never re-inits from a ref change
// Pose: direct DOM mutation in useFrame — zero state updates per frame

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { ARView, ARAnchor } from 'react-three-mind'
import { useTexture, Text, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CARD_CONFIG } from '@/lib/ar-config'
import { downloadVCF } from '@/lib/vcf'
import { AnchorContent } from './AnchorContent'
import { usePreprocessedCamera } from '@/lib/camera-preprocess'

// ── Filter profiles ───────────────────────────────────────────────────────────
// MindAR One-Euro filter: minCF = cutoff frequency, beta = speed coefficient.
// Lower minCF = smoother but laggier. Higher beta = faster but jitterier.
// missTolerance: frames before anchor is declared lost (lower = snappier).
// warmupTolerance: frames needed to confirm detection (lower = faster first lock).

type Profile = 'smooth' | 'balanced' | 'fast'
const PROFILES: Record<Profile, { minCF: number; beta: number; missTol: number; warmup: number }> = {
  smooth:   { minCF: 0.0001, beta: 5,   missTol: 10, warmup: 5 },
  balanced: { minCF: 0.001,  beta: 20,  missTol: 5,  warmup: 3 },
  fast:     { minCF: 0.01,   beta: 100, missTol: 3,  warmup: 2 },
}

// ── Debug log ─────────────────────────────────────────────────────────────────
type LogType = 'info' | 'ok' | 'warn' | 'data'
type LogEntry = { id: number; t: string; msg: string; type: LogType }
let _id = 0

function useDebugLog() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const add = useCallback((msg: string, type: LogType = 'info') => {
    const t = new Date().toLocaleTimeString('en', { hour12: false })
    const entry: LogEntry = { id: _id++, t: t.slice(-8), msg, type }
    console.log(`[AR][${type.toUpperCase()}] ${msg}`)
    setLogs(p => [...p.slice(-199), entry])
  }, [])
  return { logs, add }
}

// ── CardFrame — pulsing outline ───────────────────────────────────────────────
function CardFrame() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity =
      0.06 + Math.abs(Math.sin(clock.getElapsedTime() * 1.5)) * 0.12
  })
  return (
    <mesh ref={ref} position={[0, 0, 0.001]}>
      <planeGeometry args={[1.0, 0.635]} />
      <meshBasicMaterial color="#818cf8" transparent opacity={0.08} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ── ContactCard ───────────────────────────────────────────────────────────────
function ContactCard() {
  const texture = useTexture(CARD_CONFIG.cardImage)
  texture.flipY = false
  const [saved, setSaved] = useState(false)
  const { owner } = CARD_CONFIG
  const W = 0.7, H = W * 0.625
  return (
    <group position={[0, 0.82, 0.05]}>
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
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

// ── ARContent — runs inside R3F canvas, writes pose to DOM refs ───────────────
function ARContent({
  onFound, onLost,
  onPoseDom, onFpsDom,
  onPoseLog,
  flip,
}: {
  onFound: () => void
  onLost: () => void
  onPoseDom: React.RefObject<HTMLSpanElement>
  onFpsDom: React.RefObject<HTMLSpanElement>
  onPoseLog: (msg: string) => void
  flip: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const _p = useRef(new THREE.Vector3())
  const _q = useRef(new THREE.Quaternion())
  const _e = useRef(new THREE.Euler())
  const _s = useRef(new THREE.Vector3())
  const lastPoseLog = useRef(0)

  // FPS tracking — count frames, reset every second
  const frameCount = useRef(0)
  const lastFpsTs  = useRef(performance.now())

  useFrame(() => {
    // ── FPS ──────────────────────────────────────────────────────────────────
    frameCount.current++
    const now = performance.now()
    if (now - lastFpsTs.current >= 1000) {
      const fps = frameCount.current
      frameCount.current = 0
      lastFpsTs.current = now
      if (onFpsDom.current) onFpsDom.current.textContent = `${fps}fps`
      if (fps < 30) console.warn(`[AR][PERF] low FPS: ${fps}`)
    }

    // ── Pose ─────────────────────────────────────────────────────────────────
    if (!groupRef.current) return
    groupRef.current.matrixWorld.decompose(_p.current, _q.current, _s.current)
    _e.current.setFromQuaternion(_q.current)

    const px = _p.current.x.toFixed(2), py = _p.current.y.toFixed(2), pz = _p.current.z.toFixed(2)
    const rx = THREE.MathUtils.radToDeg(_e.current.x).toFixed(1)
    const ry = THREE.MathUtils.radToDeg(_e.current.y).toFixed(1)
    const rz = THREE.MathUtils.radToDeg(_e.current.z).toFixed(1)
    const sx = _s.current.x.toFixed(3)
    const vis = groupRef.current.visible ? 'Y' : 'N'

    if (onPoseDom.current) {
      onPoseDom.current.textContent =
        `pos(${px},${py},${pz}) rot(${rx}°,${ry}°,${rz}°) sc:${sx} vis:${vis}`
    }

    // Throttled pose log every 2s — avoid flooding the panel
    if (groupRef.current.visible && now - lastPoseLog.current > 2000) {
      lastPoseLog.current = now
      onPoseLog(`pos(${px},${py},${pz}) rot(${rx}°,${ry}°,${rz}°) sc:${sx}`)
    }
  })

  return (
    <ARAnchor target={0} onAnchorFound={onFound} onAnchorLost={onLost}>
      <group ref={groupRef}>
        <ambientLight intensity={1.2} />
        {/* DEBUG axes: red=X, green=Y, blue=Z. Should follow card plane. */}
        <axesHelper args={[0.5]} />
        <AnchorContent flip={flip}>
          <CardFrame />
          <Suspense fallback={null}>
            <ContactCard />
          </Suspense>
        </AnchorContent>
      </group>
    </ARAnchor>
  )
}

// ── Debug panel ───────────────────────────────────────────────────────────────
const LOG_COLOR: Record<LogType, string> = {
  info: '#64748b', ok: '#4ade80', warn: '#fbbf24', data: '#818cf8',
}

function DebugPanel({
  logs, tracking, ready,
  poseDomRef, fpsDomRef,
  camera, onCameraToggle,
  glareFilter, onGlareToggle,
  profile, onProfile,
  params,
  foundCount, lostCount,
  onReset,
}: {
  logs: LogEntry[]
  tracking: boolean
  ready: boolean
  poseDomRef: React.RefObject<HTMLSpanElement>
  fpsDomRef: React.RefObject<HTMLSpanElement>
  camera: 'back' | 'front'
  onCameraToggle: (c: 'back' | 'front') => void
  glareFilter: boolean
  onGlareToggle: () => void
  profile: Profile
  onProfile: (p: Profile) => void
  params: typeof PROFILES[Profile]
  foundCount: React.RefObject<number>
  lostCount: React.RefObject<number>
  onReset: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [logs])

  const statusColor = tracking ? '#4ade80' : ready ? '#fbbf24' : '#818cf8'
  const statusBg    = tracking ? '#14532d' : ready ? '#451a03' : '#1e1b4b'
  const statusText  = tracking ? '● TRACKING' : ready ? '○ SCANNING' : '◌ INIT'

  const btnBase = { border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace', padding: '2px 7px' }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: '42vh',
      background: '#080810', borderTop: '1px solid #1e1e2e',
      display: 'flex', flexDirection: 'column', fontFamily: 'monospace', zIndex: 20,
    }}>

      {/* ── Row 1: status + fps + pose ────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderBottom: '1px solid #1e1e2e', background: '#0d0d1a', fontSize: 11, flexWrap: 'wrap', rowGap: 3 }}>
        <span style={{ color: '#334155' }}>AR DEBUG</span>
        <span style={{ padding: '2px 7px', borderRadius: 4, fontWeight: 700, background: statusBg, color: statusColor }}>{statusText}</span>
        <span ref={fpsDomRef}  style={{ color: '#22d3ee', fontSize: 10 }}>—fps</span>
        <span style={{ color: '#475569', fontSize: 9 }}>found:{foundCount.current} lost:{lostCount.current}</span>
        <span ref={poseDomRef} style={{ color: '#818cf8', fontSize: 9, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>—</span>
      </div>

      {/* ── Row 2: controls ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderBottom: '1px solid #1e1e2e', background: '#090912', fontSize: 10, flexWrap: 'wrap', rowGap: 3 }}>
        {/* Camera */}
        {(['back', 'front'] as const).map(c => (
          <button key={c} onClick={() => onCameraToggle(c)}
            style={{ ...btnBase, background: camera === c ? '#312e81' : '#111', color: camera === c ? '#a5b4fc' : '#64748b' }}>
            {c === 'back' ? '📷 Back' : '🤳 Front'}
          </button>
        ))}
        <span style={{ color: '#1e293b' }}>│</span>
        {/* Filter profile */}
        {(['smooth', 'balanced', 'fast'] as Profile[]).map(p => (
          <button key={p} onClick={() => onProfile(p)}
            style={{ ...btnBase, background: profile === p ? '#1e3a5f' : '#111', color: profile === p ? '#60a5fa' : '#64748b' }}>
            {p.toUpperCase()}
          </button>
        ))}
        <span style={{ color: '#334155', fontSize: 9 }}>
          cf:{params.minCF} β:{params.beta} miss:{params.missTol} wu:{params.warmup}
        </span>
        <span style={{ color: '#1e293b' }}>│</span>
        {/* Glare */}
        <button onClick={onGlareToggle}
          style={{ ...btnBase, background: glareFilter ? '#1e3a5f' : '#2d1b1b', color: glareFilter ? '#60a5fa' : '#f87171' }}>
          {glareFilter ? '✦ GLARE ON' : '✦ GLARE OFF'}
        </button>
        {/* Reset */}
        <button onClick={onReset}
          style={{ ...btnBase, marginLeft: 'auto', background: '#2d1b1b', color: '#f87171' }}>
          ↺ RESET
        </button>
      </div>

      {/* ── Log ──────────────────────────────────────────────────────────── */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '2px 0' }}>
        {logs.length === 0 && (
          <div style={{ padding: '2px 10px', fontSize: 11, color: '#1e293b' }}>waiting…</div>
        )}
        {logs.map(l => (
          <div key={l.id} style={{ display: 'flex', gap: 8, padding: '1px 10px', fontSize: 11, lineHeight: '17px' }}>
            <span style={{ color: '#334155', flexShrink: 0 }}>{l.t}</span>
            <span style={{ color: LOG_COLOR[l.type] }}>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Scene root ────────────────────────────────────────────────────────────────
export function ARScene() {
  const [tracking, setTracking]   = useState(false)
  const [ready,    setReady]      = useState(false)
  const [camera,   setCamera]     = useState<'back' | 'front'>('back')
  const [glareFilter, setGlareFilter] = useState(true)
  const [profile,  setProfile]    = useState<Profile>('balanced')
  const [paramKey, setParamKey]   = useState(0) // increment to remount ARView with new params
  const { logs, add } = useDebugLog()
  const poseDomRef = useRef<HTMLSpanElement>(null)
  const fpsDomRef  = useRef<HTMLSpanElement>(null)

  // Event counters — refs to avoid re-renders
  const foundCount = useRef(0)
  const lostCount  = useRef(0)
  const lastFoundTs = useRef<number | null>(null)

  // Install camera preprocessor once; toggle shader via uniform (no stream restart)
  usePreprocessedCamera(glareFilter)

  const params = PROFILES[profile]

  // ARView key: remount on camera change OR explicit param reset
  const arKey = `${camera}-${paramKey}`

  // ── Callbacks ──────────────────────────────────────────────────────────────
  const handleReady = useCallback(() => {
    setReady(true)
    add(`onReady ✓ — MindAR ready | cam:${camera} profile:${profile} glare:${glareFilter}`, 'ok')
    console.log('[AR] MindAR initialized', { camera, profile, params, glareFilter, arKey })
  }, [add, camera, profile, params, glareFilter, arKey])

  const handleError = useCallback((e: unknown) => {
    add(`onError: ${String(e)}`, 'warn')
    console.error('[AR] ARView error', e)
  }, [add])

  const handleFound = useCallback(() => {
    setTracking(true)
    foundCount.current++
    lastFoundTs.current = Date.now()
    add(`onAnchorFound #${foundCount.current}`, 'ok')
    console.log('[AR] Anchor FOUND', {
      count: foundCount.current,
      sinceLastLost: lostCount.current > 0 ? `${((Date.now() - (lastFoundTs.current ?? 0)) / 1000).toFixed(1)}s` : 'first',
    })
    if (navigator.vibrate) navigator.vibrate(50)
  }, [add])

  const handleLost = useCallback(() => {
    setTracking(false)
    lostCount.current++
    const held = lastFoundTs.current
      ? `${((Date.now() - lastFoundTs.current) / 1000).toFixed(1)}s`
      : '?'
    add(`onAnchorLost #${lostCount.current} — held ${held}`, 'warn')
    console.log('[AR] Anchor LOST', { count: lostCount.current, held })
  }, [add])

  const handlePoseLog = useCallback((msg: string) => {
    add(`pose ${msg}`, 'data')
  }, [add])

  // ── Mount log ──────────────────────────────────────────────────────────────
  useEffect(() => {
    add('ARScene mounted', 'info')
    add(`UA: ${navigator.userAgent.slice(0, 80)}`)
    add(`mind:${CARD_CONFIG.mindFile} img:${CARD_CONFIG.cardImage}`)
    if (!navigator.mediaDevices?.getUserMedia)
      add('ERROR: camera API unavailable — must be HTTPS', 'warn')
    console.log('[AR] ARScene mounted', {
      mindFile: CARD_CONFIG.mindFile,
      cardImage: CARD_CONFIG.cardImage,
      ua: navigator.userAgent,
    })
  }, [add])

  useEffect(() => {
    add(`profile → ${profile} | cf:${params.minCF} β:${params.beta} miss:${params.missTol} wu:${params.warmup}`, 'data')
    console.log('[AR] Profile changed', { profile, params })
  }, [add, profile, params])

  useEffect(() => {
    add(`glare-filter → ${glareFilter ? 'ON' : 'OFF (bypass)'}`, 'data')
    console.log('[AR] Glare filter', glareFilter)
  }, [add, glareFilter])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCameraToggle = (c: 'back' | 'front') => {
    console.log('[AR] Camera switch →', c)
    setCamera(c)
    setReady(false)
    setTracking(false)
    add(`camera → ${c}`, 'info')
  }

  const handleProfileChange = (p: Profile) => {
    setProfile(p)
    setReady(false)
    setTracking(false)
    setParamKey(k => k + 1) // forces ARView remount with new filter params
    add(`remounting ARView with profile ${p}`, 'info')
    console.log('[AR] Remounting ARView with profile', p, PROFILES[p])
  }

  const handleReset = () => {
    setReady(false)
    setTracking(false)
    setParamKey(k => k + 1)
    foundCount.current = 0
    lostCount.current = 0
    lastFoundTs.current = null
    add('RESET — counters cleared, ARView remounting', 'warn')
    console.log('[AR] Manual reset')
  }

  return (
    <>
      {/* AR viewport — top 58vh */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '58vh', overflow: 'hidden', zIndex: 0 }}>
        <ARView
          key={arKey}
          imageTargets={CARD_CONFIG.mindFile}
          style={{ position: 'absolute', inset: 0 }}
          onReady={handleReady}
          onError={handleError}
          flipUserCamera={camera === 'front'}
          filterMinCF={params.minCF}
          filterBeta={params.beta}
          missTolerance={params.missTol}
          warmupTolerance={params.warmup}
          maxTrack={1}
          dpr={[1, 1.5]}
          debugMode={true}
        >
          <ARContent
            onFound={handleFound}
            onLost={handleLost}
            onPoseDom={poseDomRef}
            onFpsDom={fpsDomRef}
            onPoseLog={handlePoseLog}
            flip={camera === 'front'}
          />
        </ARView>

        {/* Status overlay badge */}
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}>
          {tracking ? (
            <div style={{ background: 'rgba(34,197,94,0.25)', border: '1px solid rgba(34,197,94,0.5)', borderRadius: 100, padding: '5px 14px', color: '#4ade80', fontSize: 12, fontWeight: 600, fontFamily: 'system-ui', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Card detected
            </div>
          ) : ready ? (
            <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '5px 14px', color: '#fff', fontSize: 12, fontFamily: 'system-ui', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              Point at card
            </div>
          ) : null}
        </div>
      </div>

      <DebugPanel
        logs={logs} tracking={tracking} ready={ready}
        poseDomRef={poseDomRef} fpsDomRef={fpsDomRef}
        camera={camera} onCameraToggle={handleCameraToggle}
        glareFilter={glareFilter} onGlareToggle={() => setGlareFilter(f => !f)}
        profile={profile} onProfile={handleProfileChange}
        params={params}
        foundCount={foundCount} lostCount={lostCount}
        onReset={handleReset}
      />

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </>
  )
}
