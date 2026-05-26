import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { SignalParams, BUFFER_SIZE, DEFAULT_SIGNAL_PARAMS } from '../lib/signal/types';
import { ActiveSignal, SignalRegistry } from '../types/signals';
import { generateSignal } from '../lib/signal/waveforms';
import { modulateAM, modulateFM } from '../lib/signal/modulation';
import { detectFrequency, calculateVpp } from '../lib/signal/utils';

// Tipe state
interface SignalState {
  // Sinyal aktif per portId
  signals: SignalRegistry;

  // Sample rate global (100kHz untuk semua instrumen)
  sampleRate: number;

  // Apakah engine sedang aktif (ada instrumen yang ON)
  isEngineRunning: boolean;

  // Actions

  // Compute ulang sinyal untuk satu port
  computeSignal: (portId: string, params: SignalParams) => void;

  // Compute sinyal AM (butuh dua input: carrier + message)
  computeAMSignal: (
    portId: string,
    carrierPortId: string,
    messagePortId: string,
    depth: number
  ) => void;

  // Compute sinyal FM
  computeFMSignal: (
    portId: string,
    carrierPortId: string,
    messagePortId: string,
    deviation: number
  ) => void;

  // Ambil sinyal dari portId (untuk dibaca instrumen lain)
  getSignal: (portId: string) => ActiveSignal | null;

  // Hapus sinyal dari port (saat kabel dilepas / instrumen OFF)
  clearSignal: (portId: string) => void;

  // Clear semua sinyal
  clearAll: () => void;

  // Set running state
  setEngineRunning: (running: boolean) => void;
}

// Helper: buat ActiveSignal dari params
function createActiveSignal(
  portId: string,
  params: SignalParams,
  samples: Float32Array,
  isModulated = false
): ActiveSignal {
  return {
    id: `sig_${portId}_${Date.now()}`,
    sourcePortId: portId,
    params,
    samples,
    computedAt: performance.now(),
    isModulated,
    modulationType: isModulated ? params.waveform : null,
  };
}

// Store
export const useSignalStore = create<SignalState>()(
  subscribeWithSelector((set, get) => ({
    signals: {},
    sampleRate: 100_000,
    isEngineRunning: false,

    // Compute sinyal dasar
    computeSignal: (portId, params) => {
      const samples = generateSignal(params, BUFFER_SIZE);
      const signal = createActiveSignal(portId, params, samples);
      set(state => ({
        signals: { ...state.signals, [portId]: signal },
      }));
    },

    // Compute AM (dari dua sinyal yang sudah ada di store)
    computeAMSignal: (portId, carrierPortId, messagePortId, depth) => {
      const { signals } = get();
      const carrierSig = signals[carrierPortId];
      const messageSig = signals[messagePortId];

      if (!carrierSig || !messageSig) {
        // Salah satu input belum ada
        set(state => ({ signals: { ...state.signals, [portId]: null } }));
        return;
      }

      const samples = modulateAM(
        carrierSig.params,
        messageSig.params,
        depth,
        BUFFER_SIZE
      );

      const modParams: SignalParams = {
        ...carrierSig.params,
        waveform: 'am',
      };

      const signal = createActiveSignal(portId, modParams, samples, true);
      set(state => ({ signals: { ...state.signals, [portId]: signal } }));
    },

    // Compute FM
    computeFMSignal: (portId, carrierPortId, messagePortId, deviation) => {
      const { signals } = get();
      const carrierSig = signals[carrierPortId];
      const messageSig = signals[messagePortId];

      if (!carrierSig || !messageSig) {
        set(state => ({ signals: { ...state.signals, [portId]: null } }));
        return;
      }

      const samples = modulateFM(
        carrierSig.params,
        messageSig.params,
        deviation,
        BUFFER_SIZE
      );

      const modParams: SignalParams = {
        ...carrierSig.params,
        waveform: 'fm',
      };

      const signal = createActiveSignal(portId, modParams, samples, true);
      set(state => ({ signals: { ...state.signals, [portId]: signal } }));
    },

    // Getter
    getSignal: (portId) => {
      return get().signals[portId] ?? null;
    },

    // Hapus satu sinyal
    clearSignal: (portId) => {
      set(state => {
        const next = { ...state.signals };
        delete next[portId];
        return { signals: next };
      });
    },

    // Clear semua
    clearAll: () => set({ signals: {} }),

    // Engine state
    setEngineRunning: (running) => set({ isEngineRunning: running }),
  }))
);

// Selector helpers (untuk komponen React)
export const selectSignal = (portId: string) =>
  (state: SignalState) => state.signals[portId] ?? null;

export const selectIsEngineRunning = (state: SignalState) => state.isEngineRunning;