'use client'
// components/modules/ImageGallery.tsx

import { useState } from 'react'
import { CARD_CONFIG } from '@/lib/ar-config'

export function ImageGallery() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const { gallery } = CARD_CONFIG

  return (
    <div style={{
      background: '#0f0f0f',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      padding: '12px',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        fontSize: '10px',
        fontWeight: '600',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.3)',
        marginBottom: '10px',
      }}>
        Gallery
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '6px',
        flex: 1,
      }}>
        {gallery.slice(0, 4).map((src, i) => (
          <div
            key={i}
            onClick={() => setExpanded(src)}
            style={{
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Gallery ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => {
                // Fallback gradient if image doesn't load
                (e.target as HTMLElement).style.display = 'none'
                const parent = (e.target as HTMLElement).parentElement
                if (parent) {
                  parent.style.background = `hsl(${i * 60 + 200}, 40%, 20%)`
                  parent.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.3);font-size:11px;">Photo ${i + 1}</div>`
                }
              }}
            />
          </div>
        ))}
      </div>

      {/* Fullscreen overlay */}
      {expanded && (
        <div
          onClick={() => setExpanded(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expanded}
            alt="Expanded"
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }}
          />
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
            lineHeight: 1,
          }}>✕</div>
        </div>
      )}
    </div>
  )
}
