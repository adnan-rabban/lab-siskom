import { describe, it, expect } from 'vitest';
import { estimateFrequency } from './SignalEngine';

describe('SignalEngine - estimateFrequency', () => {
  it('should correctly estimate frequency for a centered sine wave', () => {
    // Generate a simple sine wave with 10 cycles
    const numSamples = 1024;
    const cycles = 10;
    const signal = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      signal[i] = Math.sin((2 * Math.PI * cycles * i) / numSamples);
    }

    // Expected crossings is 10
    const estimated = estimateFrequency(signal, 300, cycles);
    expect(estimated).toBeCloseTo(300, 1);
  });

  it('should correctly estimate frequency for a signal with a DC offset', () => {
    // Generate a sine wave with 10 cycles, offset by +2V (so it ranges from 1V to 3V)
    const numSamples = 1024;
    const cycles = 10;
    const signal = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      signal[i] = 2.0 + Math.sin((2 * Math.PI * cycles * i) / numSamples);
    }

    // Currently this will return 0 (or realFrequency if cyclesToShow <= 0)
    // because it never crosses 0V.
    const estimated = estimateFrequency(signal, 300, cycles);
    expect(estimated).toBeCloseTo(300, 1);
  });
});
