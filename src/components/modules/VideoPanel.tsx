'use client'
// modules/VideoPanel.tsx — YouTube or direct video embed

import { useState } from 'react'
import { CARD_CONFIG } from '@/lib/ar-config'

export function VideoPanel() {
  const [playing, setPlaying] = useState(false)
  const { video } = CARD_CONFIG

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {!playing ? (
        // Thumbnail / play button
        <div
          onClick={() => setPlaying(true)}
          style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '10px', cursor: 'pointer',
            background: 'linear-gradient(135deg, #0a0a0a, #1a0a2e)',
          }}
        >
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(99,102,241,0.5)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>{video.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Tap to play</div>
        </div>
      ) : video.type === 'youtube' ? (
        <iframe
          src={`${video.url}?autoplay=1&mute=0&rel=0`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      ) : (
        <video
          src={video.url}
          controls
          autoPlay
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      {/* Label */}
      <div style={{
        position: 'absolute', top: '8px', left: '10px',
        fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
        pointerEvents: 'none',
      }}>
        Video
      </div>
    </div>
  )
}
