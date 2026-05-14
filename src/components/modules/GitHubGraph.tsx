'use client'
// components/modules/GitHubGraph.tsx

import { useEffect, useState } from 'react'
import { fetchContributions, type ContributionData } from '@/lib/github'
import { CARD_CONFIG } from '@/lib/ar-config'

const LEVEL_COLORS = ['#1a1a1a', '#0e4429', '#006d32', '#26a641', '#39d353']

export function GitHubGraph() {
  const [data, setData] = useState<ContributionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContributions(CARD_CONFIG.owner.github).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      padding: '14px',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'DM Mono', 'Courier New', monospace",
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#fff', letterSpacing: '0.05em' }}>
          GitHub Activity
        </div>
        {data && (
          <div style={{ fontSize: '10px', color: '#39d353', fontWeight: '600' }}>
            {data.total.toLocaleString()} contributions
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
        </div>
      ) : data && data.weeks.length > 0 ? (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <svg
            width="100%"
            viewBox={`0 0 ${data.weeks.length * 11} 80`}
            style={{ display: 'block' }}
          >
            {data.weeks.map((week, wi) =>
              week.map((day, di) => (
                <rect
                  key={`${wi}-${di}`}
                  x={wi * 11}
                  y={di * 11}
                  width={9}
                  height={9}
                  rx={2}
                  fill={LEVEL_COLORS[day.level ?? 0]}
                />
              ))
            )}
          </svg>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '6px' }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>Less</span>
            {LEVEL_COLORS.map((c, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
            ))}
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>More</span>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>No data available</div>
        </div>
      )}
    </div>
  )
}
