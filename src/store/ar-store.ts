// store/ar-store.ts
import { create } from 'zustand'

interface ARTransform {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number; w: number }
  scale: number
}

interface ARStore {
  isTracking: boolean
  transform: ARTransform | null
  setTracking: (transform: ARTransform) => void
  setLost: () => void
}

export const useARStore = create<ARStore>((set) => ({
  isTracking: false,
  transform: null,
  setTracking: (transform) => set({ isTracking: true, transform }),
  setLost: () => set({ isTracking: false }),
}))
