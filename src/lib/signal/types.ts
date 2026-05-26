// Fondasi dari seluruh simulasi sinyal
export type WaveformType =
  | 'sine'
  | 'square'
  | 'ramp'
  | 'triangle'
  | 'noise'
  | 'arb'
  | 'am'
  | 'fm'
  | 'dsb'
  | 'fsk'
  | 'digital'
  | 'sampled'
  | 'dc';

export type PortType = 'bnc_out' | 'bnc_in' | 'sync_out' | 'mod_out' | 'mod_in' | 'trigger';

export type InstrumentId = 'afg' | 'afg2' | 'osc' | 'gfc' | 'pudak_am' | 'pudak_fm' | 'pudak_demod' | 'pudak_digital' | 'pudak_sh' | 'pudak_mux';

// Parameter sinyal mentah
export interface SignalParams {
  waveform: WaveformType;
  frequency: number;    // Hz
  amplitude: number;    // Vpp (peak-to-peak)
  offset: number;       // V DC offset
  phase: number;        // radian (0 ~ 2π)
  dutyCycle: number;    // 0.01 ~ 0.99 (square/ramp)
  sampleRate: number;   // Hz, default 100_000
}

// Buffer hasil kalkulasi sinyal
export interface SignalBuffer {
  id: string;
  samples: Float32Array;    // nilai amplitudo per sample
  params: SignalParams;
  timestamp: number;        // performance.now() saat kalkulasi
  isValid: boolean;         // false jika port belum terhubung
}

// Satu port koneksi pada instrumen
export interface Port {
  id: string;               // e.g. "afg_main_out"
  instrumentId: InstrumentId;
  type: PortType;
  label: string;            // e.g. "MAIN OUTPUT", "CH1"
  // posisi relatif terhadap instrumen (0–1)
  relativeX: number;
  relativeY: number;
}

// Kabel yang menghubungkan dua port
export interface Cable {
  id: string;
  fromPortId: string;
  toPortId: string;
  color: CableColor;
}

export type CableColor = 'yellow' | 'red' | 'black' | 'blue' | 'green';

// Default signal params (function generator baru dinyalakan)
export const DEFAULT_SIGNAL_PARAMS: SignalParams = {
  waveform: 'sine',
  frequency: 1_000,   // 1 kHz
  amplitude: 2.0,     // 2 Vpp
  offset: 0,
  phase: 0,
  dutyCycle: 0.5,
  sampleRate: 100_000,
};

// Ukuran buffer default (jumlah sample per render frame)
export const BUFFER_SIZE = 2048;