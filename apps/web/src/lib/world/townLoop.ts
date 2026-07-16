import { step } from './townStore'

let raf = 0
let lastNow = 0
let running = false
let refCount = 0

function tick(now: number) {
  if (!running) return
  const dt = Math.min(0.05, (now - lastNow) / 1000)
  lastNow = now
  step(dt)
  raf = requestAnimationFrame(tick)
}

/** 引用计数：多个 PixelMap 挂载时共享一条 rAF */
export function startTownLoop() {
  refCount += 1
  if (running) return
  running = true
  lastNow = performance.now()
  raf = requestAnimationFrame(tick)
}

export function stopTownLoop() {
  refCount = Math.max(0, refCount - 1)
  if (refCount > 0) return
  running = false
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

export function isTownLoopRunning() {
  return running
}
