import { BUFFER_SIZE } from './types';

// Sample and Hold
// Sinyal di-sample pada setiap rising edge clock, kemudian
// ditahan hingga clock berikutnya.
export function sampleAndHold(
  input: Float32Array,
  clockRate: number,
  sampleRate = 100_000,
  bufferSize = BUFFER_SIZE
): Float32Array {
  const out = new Float32Array(bufferSize);
  const samplesPerClock = Math.round(sampleRate / clockRate);

  let heldValue = 0;
  for (let i = 0; i < bufferSize; i++) {
    // Rising edge clock: ambil sample baru
    if (i % samplesPerClock === 0) {
      heldValue = input[i] ?? 0;
    }
    out[i] = heldValue;
  }
  return out;
}

// Ideal Sampler (impulse train)
// Mengembalikan sinyal yang bernilai hanya pada titik sample,
// nol di antaranya. Berguna untuk visualisasi aliasing.
export function idealSampler(
  input: Float32Array,
  clockRate: number,
  sampleRate = 100_000,
  bufferSize = BUFFER_SIZE
): Float32Array {
  const out = new Float32Array(bufferSize);
  const samplesPerClock = Math.round(sampleRate / clockRate);

  for (let i = 0; i < bufferSize; i++) {
    out[i] = (i % samplesPerClock === 0) ? (input[i] ?? 0) : 0;
  }
  return out;
}

// Aliasing Simulation
// Mensimulasikan efek aliasing saat fs < 2 * fSignal (Nyquist violated).
// Menghasilkan sinyal alias dengan frekuensi:
//   f_alias = |f_signal - round(f_signal / fs) * fs|
export function simulateAliasing(
  signalFreq: number,
  signalAmplitude: number,
  clockRate: number,
  sampleRate = 100_000,
  bufferSize = BUFFER_SIZE
): { original: Float32Array; aliased: Float32Array; aliasFreq: number } {
  const TWO_PI = 2 * Math.PI;
  const original = new Float32Array(bufferSize);
  const aliased = new Float32Array(bufferSize);

  // Hitung frekuensi alias
  const n = Math.round(signalFreq / clockRate);
  const aliasFreq = Math.abs(signalFreq - n * clockRate);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / sampleRate;
    original[i] = (signalAmplitude / 2) * Math.sin(TWO_PI * signalFreq * t);
    aliased[i] = (signalAmplitude / 2) * Math.sin(TWO_PI * aliasFreq * t);
  }

  return { original, aliased, aliasFreq };
}

// Time-Division Multiplexing (TDM)
// Menggabungkan N channel dalam satu time slot secara bergantian.
// channels : array sinyal (masing-masing Float32Array)
// clockRate: frekuensi sampling per channel (Hz)
export function multiplexTDM(
  channels: Float32Array[],
  clockRate: number,
  sampleRate = 100_000,
  bufferSize = BUFFER_SIZE
): Float32Array {
  const out = new Float32Array(bufferSize);
  const n = channels.length;
  if (n === 0) return out;

  const samplesPerSlot = Math.max(1, Math.round(sampleRate / (clockRate * n)));

  for (let i = 0; i < bufferSize; i++) {
    const framePos = Math.floor(i / samplesPerSlot) % n;
    out[i] = channels[framePos]?.[i] ?? 0;
  }
  return out;
}

// Demultiplexer (ambil satu channel dari TDM)
export function demultiplexTDM(
  muxed: Float32Array,
  channelIndex: number,
  totalChannels: number,
  clockRate: number,
  sampleRate = 100_000
): Float32Array {
  const out = new Float32Array(muxed.length);
  const samplesPerSlot = Math.max(1, Math.round(sampleRate / (clockRate * totalChannels)));

  for (let i = 0; i < muxed.length; i++) {
    const framePos = Math.floor(i / samplesPerSlot) % totalChannels;
    out[i] = framePos === channelIndex ? muxed[i] : 0;
  }
  return out;
}

// Rekonstruksi sinyal dari S&H (interpolasi linear)
export function reconstructFromSH(
  sampled: Float32Array,
  clockRate: number,
  sampleRate = 100_000
): Float32Array {
  const out = new Float32Array(sampled.length);
  const samplesPerClock = Math.round(sampleRate / clockRate);

  for (let i = 0; i < sampled.length; i++) {
    const blockStart = Math.floor(i / samplesPerClock) * samplesPerClock;
    const blockEnd = Math.min(blockStart + samplesPerClock, sampled.length - 1);

    const v0 = sampled[blockStart];
    const v1 = sampled[blockEnd];
    const t = (i - blockStart) / samplesPerClock;

    out[i] = v0 + (v1 - v0) * t; // linear interpolation
  }
  return out;
}

// Quantizer (ADC simulasi)
// Membulatkan nilai sinyal ke step terdekat sesuai resolusi bit.
export function quantize(
  input: Float32Array,
  bits = 8,
  vMin = -5,
  vMax = 5
): Float32Array {
  const out = new Float32Array(input.length);
  const levels = Math.pow(2, bits);
  const step = (vMax - vMin) / levels;

  for (let i = 0; i < input.length; i++) {
    const clamped = Math.max(vMin, Math.min(vMax, input[i]));
    out[i] = Math.round((clamped - vMin) / step) * step + vMin;
  }
  return out;
}