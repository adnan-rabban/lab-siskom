import { BUFFER_SIZE } from './types';

// ── Vpp — Peak-to-Peak Voltage ───────────────────────────────
export function calculateVpp(buf: Float32Array): number {
  if (buf.length === 0) return 0;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] < min) min = buf[i];
    if (buf[i] > max) max = buf[i];
  }
  return max - min;
}

// Vmax / Vmin
export function calculateVmax(buf: Float32Array): number {
  if (buf.length === 0) return 0;
  let max = -Infinity;
  for (let i = 0; i < buf.length; i++) if (buf[i] > max) max = buf[i];
  return max;
}

export function calculateVmin(buf: Float32Array): number {
  if (buf.length === 0) return 0;
  let min = Infinity;
  for (let i = 0; i < buf.length; i++) if (buf[i] < min) min = buf[i];
  return min;
}

// Average / DC offset
export function calculateVavg(buf: Float32Array): number {
  if (buf.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i];
  return sum / buf.length;
}

// Root Mean Square Voltage
export function calculateVrms(buf: Float32Array): number {
  if (buf.length === 0) return 0;
  let sumSq = 0;
  for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
  return Math.sqrt(sumSq / buf.length);
}

// Amplitude (Vhi - Vlo, menghilangkan spike)
export function calculateVamp(buf: Float32Array): number {
  return calculateVpp(buf); // simplifikasi
}

// Frekuensi via Zero-Crossing
export function detectFrequency(buf: Float32Array, sampleRate = 100_000): number {
  if (buf.length < 4) return 0;

  const avg = calculateVavg(buf);
  let crossings = 0;
  let lastWasBelow = buf[0] < avg;

  for (let i = 1; i < buf.length; i++) {
    const isBelow = buf[i] < avg;
    // Rising crossing: dari bawah ke atas
    if (lastWasBelow && !isBelow) {
      crossings++;
    }
    lastWasBelow = isBelow;
  }

  if (crossings < 2) return 0;

  // Durasi buffer dalam detik
  const duration = buf.length / sampleRate;
  return crossings / duration;
}

// Periode (1/f)
export function detectPeriod(buf: Float32Array, sampleRate = 100_000): number {
  const freq = detectFrequency(buf, sampleRate);
  return freq > 0 ? 1 / freq : 0;
}

// Duty Cycle (%)
export function calculateDutyCycle(buf: Float32Array): number {
  if (buf.length === 0) return 0;
  const avg = calculateVavg(buf);
  let aboveCount = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] >= avg) aboveCount++;
  }
  return (aboveCount / buf.length) * 100;
}

// Rise Time (10% → 90%)
export function calculateRiseTime(buf: Float32Array, sampleRate = 100_000): number {
  const vmax = calculateVmax(buf);
  const vmin = calculateVmin(buf);
  const range = vmax - vmin;
  if (range === 0) return 0;

  const v10 = vmin + range * 0.1;
  const v90 = vmin + range * 0.9;

  let t10 = -1;
  let t90 = -1;

  for (let i = 1; i < buf.length; i++) {
    if (t10 < 0 && buf[i - 1] < v10 && buf[i] >= v10) {
      t10 = i / sampleRate;
    }
    if (t10 >= 0 && t90 < 0 && buf[i - 1] < v90 && buf[i] >= v90) {
      t90 = i / sampleRate;
      break;
    }
  }

  if (t10 < 0 || t90 < 0) return 0;
  return t90 - t10;
}

// FFT (DFT sederhana, untuk tampilan spektrum di osiloskop)
// Mengembalikan { frequencies, magnitudes } untuk digambar.\
export function computeFFT(
  buf: Float32Array,
  sampleRate = 100_000
): { frequencies: Float32Array; magnitudes: Float32Array } {
  const N = Math.min(buf.length, 512); // batasi ukuran untuk performa
  const magnitudes = new Float32Array(N / 2);
  const frequencies = new Float32Array(N / 2);

  // Windowing (Hanning window untuk kurangi spectral leakage)
  const windowed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
    windowed[i] = buf[i] * w;
  }

  // DFT — O(N²), cukup untuk N=512
  for (let k = 0; k < N / 2; k++) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      real += windowed[n] * Math.cos(angle);
      imag -= windowed[n] * Math.sin(angle);
    }
    magnitudes[k] = (2 / N) * Math.sqrt(real * real + imag * imag);
    frequencies[k] = (k * sampleRate) / N;
  }

  return { frequencies, magnitudes };
}

// Format display frekuensi (seperti di GFC-8010H)
// Input : Hz (number)
// Output: string dengan satuan (Hz / kHz / MHz)
export function formatFrequency(hz: number, digits = 8): string {
  if (hz === 0) return '0.000000 Hz';

  if (hz >= 1_000_000) {
    return `${(hz / 1_000_000).toFixed(digits - 3)} MHz`;
  } else if (hz >= 1_000) {
    return `${(hz / 1_000).toFixed(digits - 2)} kHz`;
  } else if (hz >= 1) {
    return `${hz.toFixed(digits - 1)} Hz`;
  } else {
    return `${(hz * 1_000).toFixed(digits - 1)} mHz`;
  }
}

// Format voltage (seperti di display AFG / osiloskop)
export function formatVoltage(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1) return `${v.toFixed(3)} V`;
  if (abs >= 0.001) return `${(v * 1000).toFixed(1)} mV`;
  return `${(v * 1_000_000).toFixed(1)} μV`;
}

// Normalize buffer ke range [-1, 1]
export function normalizeBuffer(buf: Float32Array): Float32Array {
  const vpp = calculateVpp(buf);
  if (vpp === 0) return new Float32Array(buf.length);
  const peak = vpp / 2;
  const avg = calculateVavg(buf);
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = (buf[i] - avg) / peak;
  }
  return out;
}

// Cek apakah sinyal valid (ada perubahan, bukan DC flat)
export function isSignalValid(buf: Float32Array, threshold = 0.001): boolean {
  return calculateVpp(buf) > threshold;
}

// Semua measurement sekaligus (untuk panel MEASURE osiloskop)
export interface OscMeasurements {
  vpp: number;
  vrms: number;
  vavg: number;
  vmax: number;
  vmin: number;
  frequency: number;
  period: number;
  dutyCycle: number;
  riseTime: number;
}

export function measureAll(buf: Float32Array, sampleRate = 100_000): OscMeasurements {
  const frequency = detectFrequency(buf, sampleRate);
  return {
    vpp:       calculateVpp(buf),
    vrms:      calculateVrms(buf),
    vavg:      calculateVavg(buf),
    vmax:      calculateVmax(buf),
    vmin:      calculateVmin(buf),
    frequency,
    period:    frequency > 0 ? 1 / frequency : 0,
    dutyCycle: calculateDutyCycle(buf),
    riseTime:  calculateRiseTime(buf, sampleRate),
  };
}