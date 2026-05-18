'use client'
// app/ar/ARPageClient.tsx

import dynamic from 'next/dynamic'
import { Component, type ReactNode } from 'react'

const ARScene = dynamic(
  () => import('@/components/ar/ARScene').then((m) => ({ default: m.ARScene })),
  { ssr: false, loading: () => <LoadingScreen /> }
)

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui', color: '#fff', gap: '16px',
    }}>
      <div style={{ fontSize: '32px' }}>📱</div>
      <div style={{ fontSize: '16px', fontWeight: '600' }}>BizzAR</div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Loading AR experience...</div>
      <div style={{
        width: '120px', height: '2px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '2px',
        overflow: 'hidden',
        marginTop: '8px',
      }}>
        <div style={{
          width: '40%', height: '100%',
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          borderRadius: '2px',
          animation: 'loading 1.5s ease-in-out infinite',
        }} />
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  )
}

interface EBState { error: string | null }
class ARErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null }
  static getDerivedStateFromError(e: Error): EBState {
    return { error: e.message }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, background: '#000',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui', color: '#fff', gap: '12px',
          padding: '20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px' }}>⚠️</div>
          <div style={{ fontSize: '15px', fontWeight: '600' }}>AR failed to start</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', maxWidth: '280px', wordBreak: 'break-word' }}>
            {this.state.error}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '8px', padding: '8px 20px', borderRadius: '20px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '13px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function ARPageClient() {
  return (
    <ARErrorBoundary>
      <ARScene />
    </ARErrorBoundary>
  )
}
