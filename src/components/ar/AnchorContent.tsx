'use client'
// AnchorContent.tsx
//
// react-three-mind wraps every ARAnchor in scale=[flipUserCamera ? -1 : 1, 1, 1].
// Source: react-three-mind/dist/index.js line ~32179
//
// To keep content right-side-up, this wrapper matches that scale so they cancel:
//   flipUserCamera=true  (front cam) → r3m applies -1 → we apply -1 → net +1 ✓
//   flipUserCamera=false (back cam)  → r3m applies +1 → we apply +1 → net +1 ✓
//
// flip should equal the flipUserCamera prop passed to <ARView>.
// Wrong value = mirrored overlay with axes pointing the wrong way.

import type { ReactNode } from 'react'

export function AnchorContent({ children, flip = false }: { children: ReactNode; flip?: boolean }) {
  return <group scale={[flip ? -1 : 1, 1, 1]}>{children}</group>
}
