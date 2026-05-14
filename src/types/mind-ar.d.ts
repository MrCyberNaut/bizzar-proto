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
