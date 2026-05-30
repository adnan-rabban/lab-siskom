// Throttle — batasi pemanggilan ke max 1x per `ms`
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let lastRun = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRun >= ms) {
      lastRun = now;
      fn(...args);
    }
  };
}

// Debounce — tunda pemanggilan sampai setelah `ms` idle
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Memoize 1-arg (cache last result)
export function memoizeLast<TArg, TReturn>(
  fn: (arg: TArg) => TReturn,
  isEqual: (a: TArg, b: TArg) => boolean = (a, b) => a === b,
): (arg: TArg) => TReturn {
  let lastArg: TArg;
  let lastResult: TReturn;
  let hasCached = false;
  return (arg: TArg): TReturn => {
    if (hasCached && isEqual(arg, lastArg)) return lastResult;
    lastArg    = arg;
    lastResult = fn(arg);
    hasCached  = true;
    return lastResult;
  };
}

// Signal params equality (untuk skip recompute)
export function signalParamsEqual(
  a: { frequency: number; amplitude: number; waveform: string; dutyCycle: number },
  b: { frequency: number; amplitude: number; waveform: string; dutyCycle: number },
): boolean {
  return (
    a.frequency  === b.frequency  &&
    a.amplitude  === b.amplitude  &&
    a.waveform   === b.waveform   &&
    a.dutyCycle  === b.dutyCycle
  );
}

// Frame rate limiter (60fps → limit render ke N fps)
export function createFPSLimiter(targetFPS: number) {
  const interval = 1000 / targetFPS;
  let lastTime   = 0;
  return (now: number): boolean => {
    if (now - lastTime >= interval) {
      lastTime = now;
      return true;  // frame boleh dirender
    }
    return false;   // skip frame ini
  };
}

// RAF loop manager
export class AnimationLoop {
  private rafId    = 0;
  private running  = false;
  private callback: (dt: number) => void;
  private lastTime = 0;

  constructor(callback: (dt: number) => void) {
    this.callback = callback;
    this.tick = this.tick.bind(this);
  }

  private tick(timestamp: number) {
    if (!this.running) return;
    const dt = this.lastTime ? Math.min(timestamp - this.lastTime, 100) : 0;
    this.lastTime = timestamp;
    this.callback(dt);
    this.rafId = requestAnimationFrame(this.tick);
  }

  start() {
    if (this.running) return;
    this.running  = true;
    this.lastTime = 0;
    this.rafId    = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  get isRunning() { return this.running; }
}

// Measure render time (development helper)
export function measureRender(label: string, fn: () => void) {
  if (typeof window === 'undefined') return fn(); // skip in SSR/non-dev
  const start = performance.now();
  fn();
  const end = performance.now();
  if (end - start > 8) {
    console.warn(`[perf] ${label} took ${(end - start).toFixed(1)}ms — over budget!`);
  }
}