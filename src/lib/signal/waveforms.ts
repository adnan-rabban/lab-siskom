// Fungsi matematika murni, tidak ada state, tidak ada side effects.
import { SignalParams, BUFFER_SIZE } from './types';

const TWO_PI = 2 * Math.PI;

// Sine Wave
// y(t) = A * sin(2π * f * t + φ) + offset
export function generateSine(params: SignalParams, bufferSize = BUFFER_SIZE): Float32Array {
  const { frequency, amplitude, offset, phase, sampleRate } = params;
  const buf = new Float32Array(bufferSize);
  const peak = amplitude / 2;
  const angularFreq = TWO_PI * frequency;

  for (let i = 0; i < bufferSize; i++) {
    const t = i / sampleRate;
    buf[i] = peak * Math.sin(angularFreq * t + phase) + offset;
  }
  return buf;
}

// Square Wave
// Menggunakan duty cycle. Naik saat [0, duty*T], turun saat sisanya.
export function generateSquare(params: SignalParams, bufferSize = BUFFER_SIZE): Float32Array {
  const { frequency, amplitude, offset, dutyCycle, sampleRate } = params;
  const buf = new Float32Array(bufferSize);
  const peak = amplitude / 2;
  const period = sampleRate / frequency;
  const clampedDuty = Math.max(0.01, Math.min(0.99, dutyCycle));

  for (let i = 0; i < bufferSize; i++) {
    const posInPeriod = i % period;
    buf[i] = (posInPeriod < period * clampedDuty ? peak : -peak) + offset;
  }
  return buf;
}

// Ramp / Sawtooth Wave
// Naik linear dari -A/2 ke +A/2 selama satu periode.
// Symmetry (dutyCycle): 0% = negatif sawtooth, 50% = triangle, 100% = positif sawtooth
export function generateRamp(params: SignalParams, bufferSize = BUFFER_SIZE): Float32Array {
  const { frequency, amplitude, offset, dutyCycle, sampleRate } = params;
  const buf = new Float32Array(bufferSize);
  const peak = amplitude / 2;
  const period = sampleRate / frequency;
  const symmetry = Math.max(0.001, Math.min(0.999, dutyCycle));

  for (let i = 0; i < bufferSize; i++) {
    const posInPeriod = (i % period) / period;
    let value: number;
    if (posInPeriod < symmetry) {
      // rising slope
      value = -peak + (2 * peak * posInPeriod) / symmetry;
    } else {
      // falling slope
      value = peak - (2 * peak * (posInPeriod - symmetry)) / (1 - symmetry);
    }
    buf[i] = value + offset;
  }
  return buf;
}

// Triangle Wave
// Versi simetris dari ramp (symmetry = 0.5)
export function generateTriangle(params: SignalParams, bufferSize = BUFFER_SIZE): Float32Array {
  return generateRamp({ ...params, dutyCycle: 0.5 }, bufferSize);
}

// Noise
// White noise uniform. Amplitude mengontrol rentang.
export function generateNoise(params: SignalParams, bufferSize = BUFFER_SIZE): Float32Array {
  const { amplitude, offset } = params;
  const buf = new Float32Array(bufferSize);
  const peak = amplitude / 2;

  for (let i = 0; i < bufferSize; i++) {
    buf[i] = (Math.random() * 2 - 1) * peak + offset;
  }
  return buf;
}

// DC Signal
export function generateDC(params: SignalParams, bufferSize = BUFFER_SIZE): Float32Array {
  const buf = new Float32Array(bufferSize);
  buf.fill(params.offset);
  return buf;
}

// Digital Clock (square 50% duty)
export function generateDigitalClock(params: SignalParams, bufferSize = BUFFER_SIZE): Float32Array {
  return generateSquare({ ...params, dutyCycle: 0.5 }, bufferSize);
}

// Dispatcher utama
// Panggil ini dengan params, otomatis pilih generator yang benar.
export function generateSignal(params: SignalParams, bufferSize = BUFFER_SIZE): Float32Array {
  switch (params.waveform) {
    case 'sine':     return generateSine(params, bufferSize);
    case 'square':   return generateSquare(params, bufferSize);
    case 'ramp':     return generateRamp(params, bufferSize);
    case 'triangle': return generateTriangle(params, bufferSize);
    case 'noise':    return generateNoise(params, bufferSize);
    case 'dc':       return generateDC(params, bufferSize);
    case 'digital':  return generateDigitalClock(params, bufferSize);
    default:         return generateSine(params, bufferSize);
  }
}

// Mix dua sinyal (untuk S&H, multiplexing dll)
export function mixSignals(a: Float32Array, b: Float32Array, ratioA = 0.5): Float32Array {
  const len = Math.min(a.length, b.length);
  const out = new Float32Array(len);
  const ratioB = 1 - ratioA;
  for (let i = 0; i < len; i++) {
    out[i] = a[i] * ratioA + b[i] * ratioB;
  }
  return out;
}

// Tambah DC offset ke buffer
export function addOffset(buf: Float32Array, offsetV: number): Float32Array {
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] + offsetV;
  }
  return out;
}

// Scale amplitudo
export function scaleAmplitude(buf: Float32Array, factor: number): Float32Array {
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] * factor;
  }
  return out;
}