import { describe, it, expect } from 'vitest';
import {
  estimateFrequency,
  inferOutputFrequency,
  processSignalGraph,
} from './SignalEngine';
import type { Connection, SignalNode } from './types';

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

    const estimated = estimateFrequency(signal, 300, cycles);
    expect(estimated).toBeCloseTo(300, 1);
  });
});

describe('SignalEngine - regression fixes', () => {
  it('should preserve function-generator amplitude 0 as silence', () => {
    const nodes = new Map<string, SignalNode>([
      [
        'func-gen-1',
        {
          id: 'func-gen-1',
          type: 'instrument',
          moduleType: 'function-generator',
          label: 'Function Generator',
          params: { frequency: 300, amplitude: 0, waveform: 'sine', enabled: true },
          ports: [{ id: 'output', label: 'OUTPUT', direction: 'output', nodeId: 'func-gen-1' }],
        },
      ],
    ]);

    const signal = processSignalGraph(nodes, [], 'func-gen-1', 'output', 256, 10);
    expect(signal).not.toBeNull();
    expect(Math.max(...Array.from(signal ?? [], Math.abs))).toBe(0);
  });

  it('should infer detector output frequency from the modulation input', () => {
    const nodes = new Map<string, SignalNode>([
      [
        'signal-source',
        {
          id: 'signal-source',
          type: 'source',
          moduleType: 'signal-source',
          label: 'Signal Source',
          params: { frequency: 455000, amplitude: 1, waveform: 'sine' },
          ports: [{ id: 'output', label: 'OUT', direction: 'output', nodeId: 'signal-source' }],
        },
      ],
      [
        'func-gen-1',
        {
          id: 'func-gen-1',
          type: 'instrument',
          moduleType: 'function-generator',
          label: 'Function Generator',
          params: { frequency: 300, amplitude: 1, waveform: 'sine', enabled: true },
          ports: [{ id: 'output', label: 'OUTPUT', direction: 'output', nodeId: 'func-gen-1' }],
        },
      ],
      [
        'waveform-synthesis',
        {
          id: 'waveform-synthesis',
          type: 'processor',
          moduleType: 'waveform-synthesis',
          label: 'Waveform Synthesis',
          params: { modulationIndex: 0.5 },
          ports: [],
        },
      ],
      [
        'detector',
        {
          id: 'detector',
          type: 'processor',
          moduleType: 'detector',
          label: 'Detector',
          params: { decay: 0.995, detectorType: 'diode' },
          ports: [],
        },
      ],
    ]);

    const connections: Connection[] = [
      {
        id: 'conn-sig-ws-carrier',
        fromNodeId: 'signal-source',
        fromPortId: 'output',
        toNodeId: 'waveform-synthesis',
        toPortId: 'carrier-in',
        connected: true,
      },
      {
        id: 'conn-funcgen-ws-mod',
        fromNodeId: 'func-gen-1',
        fromPortId: 'output',
        toNodeId: 'waveform-synthesis',
        toPortId: 'mod-in',
        connected: true,
      },
      {
        id: 'conn-ws-detector',
        fromNodeId: 'waveform-synthesis',
        fromPortId: 'output',
        toNodeId: 'detector',
        toPortId: 'input',
        connected: true,
      },
    ];

    expect(inferOutputFrequency(nodes, connections, 'detector')).toBe(300);
  });
});
