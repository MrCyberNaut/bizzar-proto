'use client'
// camera-preprocess.ts
// Intercepts getUserMedia, runs a WebGL pass on every frame:
//   1. Specular-highlight suppression  (glare on shiny cards)
//   2. Midtone contrast boost           (ORB feature detector needs edges)
// Returns canvas.captureStream(60) — MindAR sees a processed feed.
//
// GLARE TOGGLE: use setPreprocessorEnabled(bool) — sets a GLSL bypass uniform.
// No stream restart. The canvas keeps flowing either way.

import { useEffect } from 'react'

// ── Shader sources ─────────────────────────────────────────────────────────────

const VERT_SRC = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FRAG_SRC = `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_bypass;   // 1.0 = pass-through, 0.0 = full pipeline
varying vec2 v_uv;

vec3 rgb2hsl(vec3 c) {
  float hi = max(c.r, max(c.g, c.b));
  float lo = min(c.r, min(c.g, c.b));
  float l  = (hi + lo) * 0.5;
  float d  = hi - lo;
  if (d < 0.001) return vec3(0.0, 0.0, l);
  float s = d / (1.0 - abs(2.0 * l - 1.0));
  float h;
  if      (hi == c.r) h = mod((c.g - c.b) / d, 6.0);
  else if (hi == c.g) h = (c.b - c.r) / d + 2.0;
  else                h = (c.r - c.g) / d + 4.0;
  return vec3(h / 6.0, s, l);
}

vec3 hsl2rgb(vec3 hsl) {
  float h = hsl.x * 6.0, s = hsl.y, l = hsl.z;
  float c = (1.0 - abs(2.0 * l - 1.0)) * s;
  float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
  float m = l - c * 0.5;
  vec3 rgb;
  if      (h < 1.0) rgb = vec3(c, x, 0.0);
  else if (h < 2.0) rgb = vec3(x, c, 0.0);
  else if (h < 3.0) rgb = vec3(0.0, c, x);
  else if (h < 4.0) rgb = vec3(0.0, x, c);
  else if (h < 5.0) rgb = vec3(x, 0.0, c);
  else              rgb = vec3(c, 0.0, x);
  return rgb + m;
}

float sCurve(float x) {
  return x < 0.5
    ? 2.0 * x * x
    : 1.0 - pow(-2.0 * x + 2.0, 2.0) * 0.5;
}

void main() {
  vec4 src = texture2D(u_tex, v_uv);

  // Bypass: skip all processing, return raw pixel
  if (u_bypass > 0.5) { gl_FragColor = src; return; }

  vec3 hsl = rgb2hsl(src.rgb);

  // Glare suppression: high luminance + low saturation = specular highlight
  float glareMask = smoothstep(0.72, 0.95, hsl.z)
                  * (1.0 - smoothstep(0.0, 0.25, hsl.y));
  hsl.z = mix(hsl.z, sqrt(hsl.z) * 0.82, glareMask);

  // Midtone contrast boost (peaks at L=0.5)
  float midMask = 1.0 - abs(hsl.z * 2.0 - 1.0);
  hsl.z = mix(hsl.z, sCurve(hsl.z), midMask * 0.35);

  gl_FragColor = vec4(hsl2rgb(hsl), src.a);
}
`

// ── WebGL helpers ──────────────────────────────────────────────────────────────

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
    throw new Error(`Shader compile: ${gl.getShaderInfoLog(sh)}`)
  return sh
}

function linkProgram(gl: WebGLRenderingContext, vert: WebGLShader, frag: WebGLShader): WebGLProgram {
  const prog = gl.createProgram()!
  gl.attachShader(prog, vert)
  gl.attachShader(prog, frag)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(`Program link: ${gl.getProgramInfoLog(prog)}`)
  return prog
}

// ── CameraPreprocessor ─────────────────────────────────────────────────────────

export class CameraPreprocessor {
  private canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private program: WebGLProgram
  private uBypass: WebGLUniformLocation | null
  private tex: WebGLTexture
  private rafId: number | null = null
  private video: HTMLVideoElement | null = null
  private rawStream: MediaStream | null = null
  private readonly _boundLoop: () => void

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = 1280
    this.canvas.height = 720

    const gl = this.canvas.getContext('webgl', {
      alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false,
    })
    if (!gl) throw new Error('WebGL unavailable for camera preprocessing')
    this.gl = gl

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC)
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
    this.program = linkProgram(gl, vert, frag)

    // Full-screen quad
    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1, 1,-1, -1,1,
      -1, 1, 1,-1,  1,1,
    ]), gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(this.program, 'a_pos')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    // Video pixels are top-down; WebGL textures bottom-up — flip on upload
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    this.tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    // Activate program + constant uniforms once
    gl.useProgram(this.program)
    gl.uniform1i(gl.getUniformLocation(this.program, 'u_tex'), 0)
    this.uBypass = gl.getUniformLocation(this.program, 'u_bypass')
    gl.uniform1f(this.uBypass, 0.0) // shader active by default

    this._boundLoop = this._loop.bind(this)
  }

  async start(constraints: MediaStreamConstraints): Promise<MediaStream> {
    if (!_original) throw new Error('[camera-preprocess] _original not set before start()')
    this.rawStream = await _original(constraints)

    const track = this.rawStream.getVideoTracks()[0]
    const { width = 1280, height = 720 } = track.getSettings()
    this.canvas.width  = width
    this.canvas.height = height
    this.gl.viewport(0, 0, width, height)

    console.log(`[camera-preprocess] stream ${width}×${height}`, track.label)

    this.video = document.createElement('video')
    this.video.srcObject = this.rawStream
    this.video.muted = true
    this.video.playsInline = true
    this.video.setAttribute('playsinline', '')
    // Don't await — MindAR gets the canvas stream immediately;
    // the render loop gates on readyState >= 2.
    this.video.play().catch(e => console.warn('[camera-preprocess] play():', e))

    this._loop()
    return (this.canvas as unknown as { captureStream(fps: number): MediaStream }).captureStream(60)
  }

  /** Toggle shader effects without touching the stream. Safe to call any time. */
  setEnabled(enabled: boolean) {
    const { gl, program, uBypass } = this
    gl.useProgram(program)
    gl.uniform1f(uBypass, enabled ? 0.0 : 1.0)
    console.log(`[camera-preprocess] shader ${enabled ? 'ON' : 'BYPASSED'}`)
  }

  private _loop() {
    this.rafId = requestAnimationFrame(this._boundLoop)
    const { gl, video, tex } = this
    if (!video || video.readyState < 2) return
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  destroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    this.rawStream?.getTracks().forEach(t => t.stop())
    try { this.gl.getExtension('WEBGL_lose_context')?.loseContext() } catch { /* ignore */ }
    this.video = null
    this.rawStream = null
    this.rafId = null
  }
}

// ── Module-level state ────────────────────────────────────────────────────────

let _original: typeof navigator.mediaDevices.getUserMedia | null = null
let _instance: CameraPreprocessor | null = null

export function installCameraPreprocessor(): () => void {
  if (_original) return () => {}

  _original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
  console.log('[camera-preprocess] interceptor installed')

  navigator.mediaDevices.getUserMedia = async (constraints) => {
    _instance?.destroy()
    _instance = new CameraPreprocessor()
    try {
      const stream = await _instance.start(constraints ?? { video: true })
      console.log('[camera-preprocess] processed stream ready')
      return stream
    } catch (err) {
      console.warn('[camera-preprocess] pipeline failed, using raw stream:', err)
      _instance?.destroy()
      _instance = null
      return _original!(constraints)
    }
  }

  return () => {
    if (_original) {
      navigator.mediaDevices.getUserMedia = _original
      _original = null
    }
    _instance?.destroy()
    _instance = null
    console.log('[camera-preprocess] interceptor removed')
  }
}

/** Enable/disable the shader without touching the stream. */
export function setPreprocessorEnabled(enabled: boolean) {
  _instance?.setEnabled(enabled)
}

// ── React hook ────────────────────────────────────────────────────────────────

export function usePreprocessedCamera(enabled: boolean) {
  // Install interceptor once on mount; uninstall on unmount.
  useEffect(() => {
    const uninstall = installCameraPreprocessor()
    return uninstall
  }, [])

  // Toggle shader via uniform — no stream restart, no remount.
  useEffect(() => {
    setPreprocessorEnabled(enabled)
  }, [enabled])
}
