import { SignalParams, BUFFER_SIZE } from './types';
import { generateSignal } from './waveforms';

// ── AM — Amplitude Modulation ────────────────────────────────
// s_AM(t) = Ac * [1 + ka * m(t)] * cos(2π * fc * t)
//
// carrier  : sinyal carrier dari AFG (biasanya sine fc)
// message  : sinyal pesan dari AFG kedua (biasanya sine fm)
// depth    : indeks modulasi ka (0.0 ~ 1.2, lebih dari 1 = overmodulasi)
export function modulateAM(
  carrierParams: SignalParams,
  messageParams: SignalParams,
  depth = 0.8,
  bufferSize = BUFFER_SIZE
): Float32Array {
  const TWO_PI = 2 * Math.PI;
  const { frequency: fc, amplitude: Ac, sampleRate } = carrierParams;
  const { frequency: fm, amplitude: Am } = messageParams;
  const buf = new Float32Array(bufferSize);

  // Normalisasi message ke rentang [-1, 1]
  const messageNorm = Am / 2; // peak value

  for (let i = 0; i < bufferSize; i++) {
    const t = i / sampleRate;
    const carrier = Math.cos(TWO_PI * fc * t);
    const message = Math.sin(TWO_PI * fm * t) / messageNorm * (Am / 2);
    const normalizedMessage = (Am > 0) ? (message / (Am / 2)) : 0;
    buf[i] = (Ac / 2) * (1 + depth * normalizedMessage) * carrier;
  }
  return buf;
}

// DSB-SC — Double Sideband Suppressed Carrier
// s_DSB(t) = m(t) * Ac * cos(2π * fc * t)
// Tidak ada komponen carrier, hanya dua sideband.
export function modulateDSB(
  carrierParams: SignalParams,
  messageParams: SignalParams,
  bufferSize = BUFFER_SIZE
): Float32Array {
  const TWO_PI = 2 * Math.PI;
  const { frequency: fc, amplitude: Ac, sampleRate } = carrierParams;
  const { frequency: fm, amplitude: Am } = messageParams;
  const buf = new Float32Array(bufferSize);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / sampleRate;
    const carrier = Math.cos(TWO_PI * fc * t);
    const message = (Am / 2) * Math.sin(TWO_PI * fm * t);
    buf[i] = message * carrier;
  }
  return buf;
}

// FM — Frequency Modulation
// s_FM(t) = Ac * cos(2π * fc * t + β * sin(2π * fm * t))
//
// β = kf * Am / fm  →  modulation index
// deviation : frekuensi deviasi (Hz), max = |fc - fm_carrier_deviation|
export function modulateFM(
  carrierParams: SignalParams,
  messageParams: SignalParams,
  deviation = 5_000,    // Hz, default 5 kHz deviation
  bufferSize = BUFFER_SIZE
): Float32Array {
  const TWO_PI = 2 * Math.PI;
  const { frequency: fc, amplitude: Ac, sampleRate } = carrierParams;
  const { frequency: fm, amplitude: Am } = messageParams;
  const buf = new Float32Array(bufferSize);

  // Modulation index β = Δf / fm
  const beta = deviation / fm;

  // Akumulasi fase (integrasi message signal)
  // Untuk m(t) = Am * sin(2π * fm * t):
  // integral = -Am * cos(2π * fm * t) / (2π * fm)
  // Disederhanakan → β * sin(2π * fm * t)
  const messageNormFactor = (Am / 2 > 0) ? beta / (Am / 2) : 0;

  for (let i = 0; i < bufferSize; i++) {
    const t = i / sampleRate;
    const phaseDeviation = messageNormFactor * (Am / 2) * Math.sin(TWO_PI * fm * t);
    buf[i] = (Ac / 2) * Math.cos(TWO_PI * fc * t + phaseDeviation);
  }
  return buf;
}

// FM presisi tinggi (numerik, integrasikan sample per sample)
// Lebih akurat untuk sinyal message sembarang (non-sinusoidal).
export function modulateFMAccurate(
  carrierBuf: Float32Array,
  messageBuf: Float32Array,
  carrierParams: SignalParams,
  kf = 1_000,   // Hz/V — frequency sensitivity
): Float32Array {
  const TWO_PI = 2 * Math.PI;
  const { frequency: fc, amplitude: Ac, sampleRate } = carrierParams;
  const bufferSize = Math.min(carrierBuf.length, messageBuf.length);
  const out = new Float32Array(bufferSize);
  const dt = 1 / sampleRate;

  let phase = 0;
  for (let i = 0; i < bufferSize; i++) {
    const instantFreq = fc + kf * messageBuf[i];
    phase += TWO_PI * instantFreq * dt;
    // Bungkus phase agar tidak overflow ke infinity (modulo 2π)
    if (phase > TWO_PI * 1e6) phase -= TWO_PI * 1e6;
    out[i] = (Ac / 2) * Math.cos(phase);
  }
  return out;
}

// FSK — Frequency Shift Keying
// Berganti antara fc (bit 1) dan fhop (bit 0) berdasarkan bit clock
export function modulateFSK(
  carrierParams: SignalParams,
  hopFrequency: number,       // Hz, frekuensi untuk bit "0"
  bitRate: number,            // bps
  bufferSize = BUFFER_SIZE
): Float32Array {
  const TWO_PI = 2 * Math.PI;
  const { frequency: fc, amplitude: Ac, sampleRate } = carrierParams;
  const buf = new Float32Array(bufferSize);
  const samplesPerBit = Math.round(sampleRate / bitRate);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / sampleRate;
    const bitIndex = Math.floor(i / samplesPerBit);
    // Pola bit sederhana: alternating 1010...
    const bit = bitIndex % 2;
    const freq = bit === 1 ? fc : hopFrequency;
    buf[i] = (Ac / 2) * Math.cos(TWO_PI * freq * t);
  }
  return buf;
}

// Demodulasi AM (Envelope Detector)
// Simulasi diode envelope detector: rectify + low pass filter
// Input: sinyal AM termodulasi
// Output: sinyal message yang diekstrak (dengan DC bias)
export function demodulateAMEnvelope(
  amBuf: Float32Array,
  carrierParams: SignalParams,
  messageFreq: number,         // Hz, untuk hitung cutoff filter
): Float32Array {
  const { sampleRate } = carrierParams;
  const out = new Float32Array(amBuf.length);

  // Step 1: Rectifikasi setengah gelombang (half-wave)
  const rectified = new Float32Array(amBuf.length);
  for (let i = 0; i < amBuf.length; i++) {
    rectified[i] = Math.max(0, amBuf[i]);
  }

  // Step 2: Low pass filter RC sederhana
  // RC cutoff harus antara fm dan fc: fc >> cutoff >> fm
  const cutoff = messageFreq * 10;  // 10× message freq
  const RC = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / sampleRate;
  const alpha = dt / (RC + dt);

  let prev = rectified[0];
  for (let i = 0; i < rectified.length; i++) {
    prev = prev + alpha * (rectified[i] - prev);
    out[i] = prev;
  }
  return out;
}

// Demodulasi FM (Discriminator / Differentiator)
export function demodulateFM(
  fmBuf: Float32Array,
  sampleRate: number,
  kf = 1_000   // Hz/V (sama dengan kf waktu modulasi)
): Float32Array {
  const out = new Float32Array(fmBuf.length);
  const TWO_PI = 2 * Math.PI;

  for (let i = 1; i < fmBuf.length; i++) {
    // Diferensiasi: estimasi frekuensi instan dari perubahan amplitudo
    const diff = fmBuf[i] - fmBuf[i - 1];
    out[i] = diff / kf;
  }
  out[0] = out[1];

  // Low pass filter ringan untuk halus hasil
  const alpha = 0.1;
  for (let i = 1; i < out.length; i++) {
    out[i] = out[i - 1] + alpha * (out[i] - out[i - 1]);
  }
  return out;
}