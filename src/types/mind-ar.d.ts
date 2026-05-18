declare module 'react-three-mind' {
  import * as React from 'react'
  export interface ARViewProps {
    imageTargets: string
    children?: React.ReactNode
    style?: React.CSSProperties
    onReady?: () => void
    filterMinCF?: number
    filterBeta?: number
    missTolerance?: number
    warmupTolerance?: number
    [key: string]: unknown
  }
  export interface ARAnchorProps {
    target: number
    children?: React.ReactNode
    onAnchorFound?: () => void
    onAnchorLost?: () => void
    [key: string]: unknown
  }
  export function ARView(props: ARViewProps): React.ReactElement
  export function ARAnchor(props: ARAnchorProps): React.ReactElement
}

declare module 'mind-ar/dist/mindar-image-three.prod.js' {
  // Bundle sets window.MINDAR.IMAGE.MindARThree — no named exports
  const _: Record<string, never>
  export default _
}

interface Window {
  MINDAR?: {
    IMAGE?: {
      MindARThree: new (config: {
        container: HTMLElement
        imageTargetSrc: string
        uiLoading?: string
        uiScanning?: string
        uiError?: string
      }) => {
        renderer: import('three').WebGLRenderer
        scene: import('three').Scene
        camera: import('three').PerspectiveCamera
        start(): Promise<void>
        stop(): void
        addAnchor(targetIndex: number): {
          group: import('three').Group
          onTargetFound?: () => void
          onTargetLost?: () => void
        }
      }
    }
  }
}
