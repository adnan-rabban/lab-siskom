import { useMemo } from 'react';
import { useSignalStore } from '../store/signalStore';
import { useWorkbenchStore } from '../store/workbenchStore';
import { ActiveSignal } from '../types/signals';
import { measureAll } from '../lib/signal/utils';

const SAMPLE_RATE = 100_000;

export interface SignalReadout {
  signal:  ActiveSignal | null;
  samples: Float32Array | null;
  freq:    number;
  vpp:     number;
  vrms:    number;
  isValid: boolean;
}

const EMPTY: SignalReadout = {
  signal: null, samples: null,
  freq: 0, vpp: 0, vrms: 0, isValid: false,
};

// Baca sinyal langsung dari portId
export function useSignal(portId: string): SignalReadout {
  const signals = useSignalStore(s => s.signals);
  const sig = signals[portId] ?? null;

  return useMemo(() => {
    if (!sig?.samples?.length) return EMPTY;
    const m = measureAll(sig.samples, SAMPLE_RATE);
    return {
      signal:  sig,
      samples: sig.samples,
      freq:    m.frequency,
      vpp:     m.vpp,
      vrms:    m.vrms,
      isValid: m.vpp > 0.001,
    };
  }, [sig]);
}

// Baca sinyal dari port yang terhubung ke port instrumen tertentu
// Contoh: useConnectedSignal('osc_ch1') → sinyal dari kabel yang masuk ke CH1
export function useConnectedSignal(toPortId: string): SignalReadout {
  const cables  = useWorkbenchStore(s => s.cables);
  const signals = useSignalStore(s => s.signals);

  const cable = cables.find((c: any) => c.toPortId === toPortId);
  const sig   = cable ? (signals[cable.fromPortId] ?? null) : null;

  return useMemo(() => {
    if (!sig?.samples?.length) return EMPTY;
    const m = measureAll(sig.samples, SAMPLE_RATE);
    return {
      signal:  sig,
      samples: sig.samples,
      freq:    m.frequency,
      vpp:     m.vpp,
      vrms:    m.vrms,
      isValid: m.vpp > 0.001,
    };
  }, [sig]);
}