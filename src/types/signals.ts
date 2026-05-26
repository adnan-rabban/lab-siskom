import { SignalParams, Port, Cable, WaveformType } from '../lib/signal/types';

// Signal node: sinyal yang hidup di satu port
export interface SignalNode {
  portId: string;
  signal: ActiveSignal | null;  // null = tidak ada sinyal / belum terhubung
}

// Sinyal aktif yang mengalir di workbench
export interface ActiveSignal {
  id: string;
  sourcePortId: string;          // port yang memproduksi sinyal
  params: SignalParams;          // parameter sinyal saat ini
  samples: Float32Array;         // buffer terakhir yang dihitung
  computedAt: number;            // timestamp (performance.now())
  isModulated: boolean;          // true jika hasil modulasi
  modulationType: WaveformType | null;
}

// Koneksi workbench (daftar kabel yang aktif)
export interface WorkbenchConnection {
  cable: Cable;
  fromSignal: ActiveSignal | null;
}

// Validasi apakah dua port bisa disambungkan
export type ConnectionError =
  | 'same_instrument'       // tidak bisa self-connect
  | 'type_mismatch'         // output ke output, atau input ke input
  | 'already_connected'     // port sudah punya kabel
  | 'instrument_off'        // instrumen belum dinyalakan
  | null;

export interface ConnectionValidation {
  isValid: boolean;
  error: ConnectionError;
  message: string;
}

// Port registry: semua port yang ada di workbench
// Key: portId (e.g. "afg1_main_out")
export type PortRegistry = Record<string, Port>;

// Sinyal registry: sinyal aktif per portId
export type SignalRegistry = Record<string, ActiveSignal | null>;

// Helper: buat portId yang konsisten
export function makePortId(instrumentId: string, portName: string): string {
  return `${instrumentId}_${portName}`;
}

// Definisi semua port GW INSTEK dan PUDAK
// Digunakan sebagai referensi saat merender BNCPort di instrumen.

export const AFG_PORTS = {
  MAIN_OUT:  'main_out',   // MAIN OUTPUT BNC (front)
  SYNC_OUT:  'sync_out',   // SYNC OUTPUT BNC (front)
  MOD_OUT:   'mod_out',    // MOD output (rear, AFG-2025 only output)
} as const;

export const OSC_PORTS = {
  CH1:       'ch1',        // CH1 input BNC
  CH2:       'ch2',        // CH2 input BNC
  EXT_TRIG:  'ext_trig',  // EXT TRIG input BNC
} as const;

export const GFC_PORTS = {
  INPUT:     'input',      // Counter INPUT BNC
} as const;

// PUDAK ports — akan diperbarui saat kode alat tersedia
export const PUDAK_PORTS = {
  INPUT_A:   'input_a',
  INPUT_B:   'input_b',
  OUTPUT:    'output',
  CARRIER_IN: 'carrier_in',
  MESSAGE_IN: 'message_in',
  MOD_OUT:   'mod_out',
} as const;

// Warna kabel per tipe koneksi
// Sesuai konvensi lab nyata:
// - Probe osiloskop: kuning (CH1) dan biru (CH2)
// - BNC biasa: merah
// - Ground: hitam
export function getCableColor(
  fromPortName: string,
  toPortName: string
): import('../lib/signal/types').CableColor {
  if (toPortName.includes('ch1') || fromPortName.includes('main_out')) return 'yellow';
  if (toPortName.includes('ch2')) return 'blue';
  if (toPortName.includes('input') || fromPortName.includes('output')) return 'red';
  return 'yellow';
}