'use client'
// components/modules/VCard.tsx

import { useState } from 'react'
import { downloadVCF } from '@/lib/vcf'
import { CARD_CONFIG } from '@/lib/ar-config'

export function VCard() {
  const [downloaded, setDownloaded] = useState(false)
  const { owner } = CARD_CONFIG

  const handleDownload = () => {
    downloadVCF(owner)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '16px',
      padding: '16px',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', lineHeight: 1.2 }}>
          {owner.name}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>
          {owner.title} · {owner.company}
        </div>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>📧 {owner.email}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>📱 {owner.phone}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>🌐 {owner.website}</div>
        </div>
      </div>
      <button
        onClick={handleDownload}
        style={{
          marginTop: '12px',
          width: '100%',
          padding: '10px',
          borderRadius: '10px',
          border: 'none',
          background: downloaded
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        {downloaded ? '✓ Saved to Contacts!' : '+ Add to Contacts'}
      </button>
    </div>
  )
}
