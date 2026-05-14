'use client'
// modules/CardOverlay.tsx
// Animated shimmer frame that sits flat on the card surface (overlay panel)
// Purely decorative — highlights the card when detected

export function CardOverlay() {
  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative',
      borderRadius: '8px',
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      {/* Animated border glow */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '8px',
        border: '2px solid transparent',
        background: 'linear-gradient(#0000, #0000) padding-box, linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #6366f1) border-box',
        animation: 'borderGlow 3s linear infinite',
        backgroundSize: '200% 100%',
      }} />

      {/* Corner accents */}
      {[
        { top: 0, left: 0, borderTop: '3px solid #6366f1', borderLeft: '3px solid #6366f1' },
        { top: 0, right: 0, borderTop: '3px solid #8b5cf6', borderRight: '3px solid #8b5cf6' },
        { bottom: 0, left: 0, borderBottom: '3px solid #06b6d4', borderLeft: '3px solid #06b6d4' },
        { bottom: 0, right: 0, borderBottom: '3px solid #6366f1', borderRight: '3px solid #6366f1' },
      ].map((style, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: '20px', height: '20px',
          borderRadius: i === 0 ? '4px 0 0 0' : i === 1 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 0 4px 0',
          ...style,
        }} />
      ))}

      {/* Scanning line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)',
        animation: 'scanLine 2s ease-in-out infinite',
      }} />

      <style>{`
        @keyframes borderGlow {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        @keyframes scanLine {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}
