// ============================================================
// SignalEngine — Core signal math & waveform generation
// ============================================================
// The engine uses REAL frequencies internally (e.g. 455 kHz)
// but provides a normalized rendering interface for the
// oscilloscope so we don't need 455k samples per frame.
// ============================================================

import type { WaveformType, SignalParams, SignalNode, Connection } from './types';

const TWO_PI = 2 * Math.PI;

// ============================================================
// Waveform Generators
// ============================================================

/**
 * Generate a single sample of a base waveform at a given phase (0..1).
 */
export function waveformSample(type: WaveformType, phase: number): number {
  // Normalize phase to 0..1
  const p = phase - Math.floor(phase);

  switch (type) {
    case 'sine':
      return Math.sin(TWO_PI * p);
    case 'square':
      return p < 0.5 ? 1 : -1;
    case 'triangle':
      return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
    case 'sawtooth':
      return 2 * p - 1;
    default:
      return 0;
  }
}

// ============================================================
// Signal Generation Functions
// ============================================================

/**
 * Generate a carrier signal with optional AM modulation.
 * Uses normalized time (cycles-based) for efficient rendering.
 *
 * @param carrierFreq    Carrier frequency in Hz (real value)
 * @param carrierAmp     Carrier amplitude in volts
 * @param carrierWaveform Carrier waveform type
 * @param modFreq        Modulating signal frequency in Hz
 * @param modAmp         Modulating signal amplitude (for mod index calc)
 * @param modWaveform    Modulating signal waveform
 * @param modIndex       Modulation index (0 to 1+), overrides modAmp/carrierAmp calc
 * @param numSamples     Number of output samples
 * @param cyclesToShow   How many carrier cycles to render
 * @returns Float32Array of samples
 */
export function generateAMSignal(
  carrierFreq: number,
  carrierAmp: number,
  carrierWaveform: WaveformType,
  modFreq: number,
  modIndex: number,
  modWaveform: WaveformType,
  numSamples: number,
  cyclesToShow: number
): Float32Array {
  const output = new Float32Array(numSamples);

  // The ratio of modulating frequency to carrier frequency
  const freqRatio = modFreq / carrierFreq;

  for (let i = 0; i < numSamples; i++) {
    // Normalized time: 0 to cyclesToShow carrier cycles
    const t = (i / numSamples) * cyclesToShow;

    // Carrier phase (in cycles)
    const carrierPhase = t;

    // Modulating phase (in cycles, scaled by frequency ratio)
    const modPhase = t * freqRatio;

    // Modulating signal value (-1 to 1)
    const modSignal = waveformSample(modWaveform, modPhase);

    // AM: y(t) = Ec * (1 + m * modSignal) * carrier
    const envelope = 1 + modIndex * modSignal;
    const carrier = waveformSample(carrierWaveform, carrierPhase);

    output[i] = carrierAmp * envelope * carrier;
  }

  return output;
}

/**
 * Generate a simple waveform (no modulation).
 */
export function generateBaseSignal(
  amplitude: number,
  waveform: WaveformType,
  numSamples: number,
  cyclesToShow: number,
  phaseOffset: number = 0
): Float32Array {
  const output = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = (i / numSamples) * cyclesToShow + phaseOffset;
    output[i] = amplitude * waveformSample(waveform, t);
  }

  return output;
}

/**
 * Generate an FM modulated signal.
 * y(t) = Ec * sin(2π·fc·t + β·sin(2π·fm·t))
 */
export function generateFMSignal(
  carrierFreq: number,
  carrierAmp: number,
  modFreq: number,
  freqDeviation: number, // β = Δf / fm
  modWaveform: WaveformType,
  numSamples: number,
  cyclesToShow: number
): Float32Array {
  const output = new Float32Array(numSamples);
  const freqRatio = modFreq / carrierFreq;
  const beta = freqDeviation / modFreq;

  for (let i = 0; i < numSamples; i++) {
    const t = (i / numSamples) * cyclesToShow;
    const modPhase = t * freqRatio;
    const modSignal = waveformSample(modWaveform, modPhase);

    // FM: instantaneous phase includes modulation
    const phase = TWO_PI * t + beta * modSignal;
    output[i] = carrierAmp * Math.sin(phase);
  }

  return output;
}

// ============================================================
// Signal Processing Functions
// ============================================================

/**
 * Apply amplification/attenuation to a signal.
 */
export function applyGain(signal: Float32Array, gainDB: number): Float32Array {
  const linear = Math.pow(10, gainDB / 20);
  const output = new Float32Array(signal.length);
  for (let i = 0; i < signal.length; i++) {
    output[i] = signal[i] * linear;
  }
  return output;
}

/**
 * Simple bandpass filter simulation (for Tuned Circuit).
 * Uses a resonance model: signals near the tuned frequency pass through
 * with high amplitude, others are attenuated.
 *
 * For display purposes, we simulate the effect on the AM envelope.
 */
export function applyTunedCircuit(
  signal: Float32Array,
  signalFreq: number,
  tunedFreq: number,
  bandwidth: number,
  attenuationDB: number
): Float32Array {
  // Calculate frequency-dependent attenuation
  const delta = Math.abs(signalFreq - tunedFreq);
  const halfBW = bandwidth / 2;
  // Lorentzian response
  const response = 1 / (1 + Math.pow(delta / halfBW, 2));
  const attenuation = Math.pow(10, attenuationDB / 20);
  const totalGain = response * attenuation;

  const output = new Float32Array(signal.length);
  for (let i = 0; i < signal.length; i++) {
    output[i] = signal[i] * totalGain;
  }
  return output;
}

/**
 * Envelope detector (diode detector simulation).
 * Extracts the AM envelope from a modulated signal.
 */
export function envelopeDetect(signal: Float32Array): Float32Array {
  const output = new Float32Array(signal.length);
  let prevOutput = 0;
  const decay = 0.995; // RC time constant simulation

  for (let i = 0; i < signal.length; i++) {
    const rectified = Math.abs(signal[i]);
    if (rectified > prevOutput) {
      output[i] = rectified;
    } else {
      output[i] = prevOutput * decay;
    }
    prevOutput = output[i];
  }

  return output;
}

// ============================================================
// Measurement Functions
// ============================================================

/**
 * Measure peak-to-peak voltage of a signal.
 */
export function measureVpp(signal: Float32Array): number {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < signal.length; i++) {
    if (signal[i] < min) min = signal[i];
    if (signal[i] > max) max = signal[i];
  }
  return max - min;
}

/**
 * Measure Emax and Emin of an AM signal for modulation index calculation.
 */
export function measureAMEnvelope(signal: Float32Array): { eMax: number; eMin: number; modulationIndex: number } {
  // Find envelope peaks
  const peaks: number[] = [];
  const troughs: number[] = [];

  // Simple peak detection on rectified signal
  const rectified = new Float32Array(signal.length);
  for (let i = 0; i < signal.length; i++) {
    rectified[i] = Math.abs(signal[i]);
  }

  for (let i = 1; i < rectified.length - 1; i++) {
    if (rectified[i] > rectified[i - 1] && rectified[i] > rectified[i + 1] && rectified[i] > 0.01) {
      peaks.push(rectified[i]);
    }
  }

  // Use overall max and min of peaks for envelope
  const eMax = peaks.length > 0 ? Math.max(...peaks) : 0;
  const eMin = peaks.length > 0 ? Math.min(...peaks) : 0;

  const modulationIndex = eMax + eMin > 0
    ? ((eMax - eMin) / (eMax + eMin)) * 100
    : 0;

  return { eMax, eMin, modulationIndex };
}

/**
 * Estimate the frequency of a signal by zero-crossing detection.
 * Returns frequency relative to the carrier frequency.
 */
export function estimateFrequency(
  signal: Float32Array,
  realFrequency: number,
  cyclesToShow: number
): number {
  let crossings = 0;
  for (let i = 1; i < signal.length; i++) {
    if ((signal[i - 1] <= 0 && signal[i] > 0)) {
      crossings++;
    }
  }

  // crossings = number of complete positive-going zero crossings in cyclesToShow carrier cycles
  // Actual frequency = crossings / cyclesToShow * realFrequency (if viewing carrier cycles)
  // Simpler: the displayed signal has `crossings` cycles in the view
  // Real frequency = crossings * (realFrequency / cyclesToShow)
  if (cyclesToShow > 0) {
    return crossings * (realFrequency / cyclesToShow);
  }
  return realFrequency;
}

// ============================================================
// Graph Processor
// ============================================================

/**
 * Process the signal graph: given a set of nodes and connections,
 * compute the output signal for a specific port.
 */
export function processSignalGraph(
  nodes: Map<string, SignalNode>,
  connections: Connection[],
  targetNodeId: string,
  targetPortId: string,
  numSamples: number = 1024,
  cyclesToShow: number = 10
): Float32Array | null {
  const node = nodes.get(targetNodeId);
  if (!node) return null;

  // Find what's connected to this node's input
  const activeConnections = connections.filter(c => c.connected);

  // Check if power supply is on
  const psu = Array.from(nodes.values()).find(n => n.moduleType === 'power-supply');
  if (psu && !psu.params.enabled) {
    return new Float32Array(numSamples); // silence when powered off
  }

  switch (node.moduleType) {
    case 'signal-source': {
      const freq = node.params.frequency || 455000;
      const amp = node.params.amplitude || 1;
      const wf = node.params.waveform || 'sine';
      const atten = node.params.attenuation || 0;

      // Check if there's a modulating signal connected
      const modConnection = activeConnections.find(
        c => c.toNodeId === targetNodeId && c.toPortId === 'mod-in'
      );

      if (modConnection) {
        // Get the modulating signal's parameters
        const modNode = nodes.get(modConnection.fromNodeId);
        if (modNode) {
          const modFreq = modNode.params.frequency || 300;
          const modIndex = node.params.modulationIndex || 0.5;
          const modWf = modNode.params.waveform || 'sine';

          const signal = generateAMSignal(
            freq, amp, wf, modFreq, modIndex, modWf,
            numSamples, cyclesToShow
          );
          return applyGain(signal, atten);
        }
      }

      // No modulation — just carrier
      const signal = generateBaseSignal(amp, wf, numSamples, cyclesToShow);
      return applyGain(signal, atten);
    }

    case 'function-generator': {
      const freq = node.params.frequency || 300;
      const amp = node.params.amplitude || 1;
      const wf = node.params.waveform || 'sine';
      const dc = node.params.dcOffset || 0;

      // For function generator, cyclesToShow is based on its own frequency
      const signal = generateBaseSignal(amp, wf, numSamples, cyclesToShow);
      if (dc !== 0) {
        for (let i = 0; i < signal.length; i++) {
          signal[i] += dc;
        }
      }
      return signal;
    }

    case 'amplifier': {
      // Find input signal
      const inputConn = activeConnections.find(
        c => c.toNodeId === targetNodeId && c.toPortId === 'input'
      );
      if (!inputConn) return new Float32Array(numSamples);

      const inputSignal = processSignalGraph(
        nodes, connections,
        inputConn.fromNodeId, inputConn.fromPortId,
        numSamples, cyclesToShow
      );
      if (!inputSignal) return new Float32Array(numSamples);

      const gain = node.params.gain || 0;
      return applyGain(inputSignal, gain);
    }

    case 'tuned-circuit': {
      const inputConn = activeConnections.find(
        c => c.toNodeId === targetNodeId && c.toPortId === 'input'
      );
      if (!inputConn) return new Float32Array(numSamples);

      const inputSignal = processSignalGraph(
        nodes, connections,
        inputConn.fromNodeId, inputConn.fromPortId,
        numSamples, cyclesToShow
      );
      if (!inputSignal) return new Float32Array(numSamples);

      const inputNode = nodes.get(inputConn.fromNodeId);
      const signalFreq = inputNode?.params.frequency || 455000;
      const tunedFreq = node.params.tunedFrequency || 455000;
      const bw = node.params.bandwidth || 10000;
      const atten = node.params.attenuation || 0;

      return applyTunedCircuit(inputSignal, signalFreq, tunedFreq, bw, atten);
    }

    case 'waveform-synthesis': {
      // AM Modulator block
      const carrierConn = activeConnections.find(
        c => c.toNodeId === targetNodeId && c.toPortId === 'carrier-in'
      );
      const modConn = activeConnections.find(
        c => c.toNodeId === targetNodeId && c.toPortId === 'mod-in'
      );

      if (!carrierConn) return new Float32Array(numSamples);

      const carrierNode = nodes.get(carrierConn.fromNodeId);
      if (!carrierNode) return new Float32Array(numSamples);

      const carrierFreq = carrierNode.params.frequency || 455000;
      const carrierAmp = carrierNode.params.amplitude || 1;
      const carrierWf = carrierNode.params.waveform || 'sine';

      if (modConn) {
        const modNode = nodes.get(modConn.fromNodeId);
        if (modNode) {
          const modFreq = modNode.params.frequency || 300;
          const modIndex = node.params.modulationIndex ?? 0.5;
          const modWf = modNode.params.waveform || 'sine';

          return generateAMSignal(
            carrierFreq, carrierAmp, carrierWf,
            modFreq, modIndex, modWf,
            numSamples, cyclesToShow
          );
        }
      }

      // No modulation input — pass carrier through
      return processSignalGraph(
        nodes, connections,
        carrierConn.fromNodeId, carrierConn.fromPortId,
        numSamples, cyclesToShow
      );
    }

    case 'detector': {
      const inputConn = activeConnections.find(
        c => c.toNodeId === targetNodeId && c.toPortId === 'input'
      );
      if (!inputConn) return new Float32Array(numSamples);

      const inputSignal = processSignalGraph(
        nodes, connections,
        inputConn.fromNodeId, inputConn.fromPortId,
        numSamples, cyclesToShow
      );
      if (!inputSignal) return new Float32Array(numSamples);

      return envelopeDetect(inputSignal);
    }

    default:
      return new Float32Array(numSamples);
  }
}
