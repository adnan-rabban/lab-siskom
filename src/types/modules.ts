import { InstrumentId } from '../lib/signal/types';
import { SignalParams } from '../lib/signal/types';

// ID modul
export type ModuleId =
  | 'am'
  | 'fm'
  | 'demodulasi'
  | 'digital'
  | 'sample_hold'
  | 'aliasing';

// Satu langkah praktikum
export interface PracticeStep {
  id: number;
  title: string;                      // judul singkat step
  instruction: string;                // instruksi lengkap untuk user
  hint?: string;                      // hint tambahan jika user stuck

  // Kondisi yang harus terpenuhi untuk lanjut ke step berikutnya
  validation?: StepValidation;

  // Parameter yang diharapkan pada instrumen tertentu
  expectedParams?: Partial<Record<InstrumentId, Partial<SignalParams>>>;

  // Koneksi kabel yang harus ada
  requiredConnections?: RequiredConnection[];
}

// Validasi langkah: apa yang harus user lakukan
export interface StepValidation {
  type: 'connection' | 'parameter' | 'observe' | 'manual';

  // Untuk type 'connection': kabel apa yang harus ada
  connections?: RequiredConnection[];

  // Untuk type 'parameter': nilai parameter yang harus diset
  paramCheck?: {
    instrumentId: InstrumentId;
    field: keyof SignalParams;
    expected: number;
    tolerance: number;    // ±tolerance
  };

  // Untuk type 'observe': user hanya perlu mengamati dan konfirmasi
  confirmLabel?: string;
}

// Koneksi kabel yang diharuskan
export interface RequiredConnection {
  fromPortId: string;
  toPortId: string;
  description?: string;   // e.g. "AFG OUTPUT → PUDAK AM INPUT"
}

// Konfigurasi satu modul lengkap
export interface ModuleConfig {
  id: ModuleId;
  title: string;
  subtitle: string;
  description: string;

  // Instrumen yang muncul di workbench untuk modul ini
  instruments: InstrumentPlacement[];

  // Langkah-langkah praktikum
  steps: PracticeStep[];

  // Koneksi kabel preset (sudah tersambung saat halaman dibuka)
  // Biarkan kosong jika user harus sambung sendiri dari awal
  presetConnections?: RequiredConnection[];

  // Parameter AFG yang disarankan untuk modul ini
  suggestedParams?: {
    carrier?: Partial<SignalParams>;
    message?: Partial<SignalParams>;
  };
}

// Posisi instrumen di workbench
export interface InstrumentPlacement {
  instrumentId: InstrumentId;
  label: string;              // e.g. "Function Generator (Carrier)"
  defaultX: number;           // pixel, relatif terhadap canvas awal
  defaultY: number;
  isRequired: boolean;        // false = opsional (bisa dihide)
}

// State progres user dalam satu modul
export interface ModuleProgress {
  moduleId: ModuleId;
  currentStep: number;
  completedSteps: number[];
  startedAt: number;          // timestamp
  isComplete: boolean;
}

// Metadata semua modul (untuk landing page / sidebar)
export const MODULE_META: Record<ModuleId, { title: string; subtitle: string; color: string }> = {
  am: {
    title: 'Modulasi Amplitudo',
    subtitle: 'Amplitude Modulation (AM)',
    color: '#3B82F6',         // biru
  },
  fm: {
    title: 'Modulasi Frekuensi',
    subtitle: 'Frequency Modulation (FM)',
    color: '#8B5CF6',         // ungu
  },
  demodulasi: {
    title: 'Demodulasi',
    subtitle: 'AM & FM Demodulation',
    color: '#10B981',         // hijau
  },
  digital: {
    title: 'Sinyal Digital',
    subtitle: 'Digital Signal Fundamentals',
    color: '#F59E0B',         // kuning
  },
  sample_hold: {
    title: 'Sample and Hold',
    subtitle: 'Sampling & Reconstruction',
    color: '#EF4444',         // merah
  },
  aliasing: {
    title: 'Aliasing & Multiplexing',
    subtitle: 'TDM & Nyquist Theorem',
    color: '#EC4899',         // pink
  },
};