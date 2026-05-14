'use client'
// components/modules/Bio.tsx

import { CARD_CONFIG } from '@/lib/ar-config'

export function Bio() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #111827 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '16px',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        fontSize: '10px',
        fontWeight: '600',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.3)',
        marginBottom: '8px',
      }}>
        About
      </div>
      <p style={{
        fontSize: '13px',
        lineHeight: '1.6',
        color: 'rgba(255,255,255,0.85)',
        whiteSpace: 'pre-line',
      }}>
        {CARD_CONFIG.bio}
      </p>
    </div>
  )
}
