import { WaveformType } from '../lib/signal/types';

// AFG-2025 — Arbitrary Function Generator
// Manual: AFG-2000 Series Quick Start Guide
export type AFGUnit = 'Hz' | 'kHz' | 'MHz';
export type AFGAmplUnit = 'Vpp' | 'Vrms' | 'dBm';
export type AFGImpedance = '50Ω' | 'HighZ';

export interface AFGState {
  // Identitas
  instanceId: string;         // 'afg1' | 'afg2' (bisa ada 2 di workbench)

  // POWER
  isPowered: boolean;

  // OUTPUT (tombol OUTPUT on/off)
  isOutputOn: boolean;

  // FUNC — pilihan waveform
  waveform: WaveformType;

  // FREQ
  frequency: number;          // Hz (0.1 ~ 25_000_000)
  frequencyUnit: AFGUnit;

  // AMPL
  amplitude: number;          // Vpp saat impedance 50Ω: 0.001 ~ 10
  amplitudeUnit: AFGAmplUnit;

  // OFST
  offset: number;             // V DC, range ±5 Vpk

  // DUTY (untuk square dan ramp)
  dutyCycle: number;          // 0.01 ~ 0.99

  // Output impedance toggle (Shift + OUTPUT)
  outputImpedance: AFGImpedance;

  // Editing state (untuk UI: digit mana yang sedang di-edit)
  editingField: 'freq' | 'ampl' | 'ofst' | 'duty' | null;
}

export const DEFAULT_AFG_STATE: AFGState = {
  instanceId: 'afg1',
  isPowered: false,
  isOutputOn: false,
  waveform: 'sine',
  frequency: 1_000,
  frequencyUnit: 'kHz',
  amplitude: 2.0,
  amplitudeUnit: 'Vpp',
  offset: 0,
  dutyCycle: 0.5,
  outputImpedance: '50Ω',
  editingField: null,
};

// GDS-1102-U — Digital Storage Oscilloscope
// Manual: GDS-1000-U Series Quick Start Guide
export type OscInputCoupling = 'AC' | 'DC' | 'GND';
export type OscTriggerMode = 'Auto' | 'Normal' | 'Single';
export type OscTriggerSource = 'CH1' | 'CH2' | 'EXT' | 'Line';
export type OscTriggerCoupling = 'AC' | 'DC' | 'LF_rej' | 'HF_rej' | 'Noise_rej';
export type OscAcquisitionMode = 'Normal' | 'PeakDetect' | 'Average';
export type OscDisplayMode = 'Main' | 'Window' | 'XY' | 'Roll';
export type OscMathOp = 'Add' | 'Sub' | 'FFT' | null;

// Satu channel state (CH1 atau CH2)
export interface OscChannelState {
  isEnabled: boolean;
  coupling: OscInputCoupling;
  // VOLTS/DIV: 2mV ~ 10V/div, step 1-2-5
  voltsPerDiv: number;
  // Vertical position knob (divisions offset)
  position: number;          // -4 ~ +4 divisions
  probeAttenuation: 1 | 10; // x1 atau x10
  isInverted: boolean;
}

export interface OscState {
  // POWER
  isPowered: boolean;

  // Channels
  ch1: OscChannelState;
  ch2: OscChannelState;

  // MATH
  mathEnabled: boolean;
  mathOperation: OscMathOp;

  // HORIZONTAL
  // TIME/DIV: 1ns ~ 50s/div, step 1-2.5-5
  timePerDiv: number;        // seconds/div
  horizontalPosition: number; // seconds offset

  // TRIGGER
  triggerSource: OscTriggerSource;
  triggerMode: OscTriggerMode;
  triggerCoupling: OscTriggerCoupling;
  triggerLevel: number;      // Volts
  isRunning: boolean;        // Run/Stop

  // ACQUISITION
  acquisitionMode: OscAcquisitionMode;
  averageCount: 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256;

  // DISPLAY
  displayMode: OscDisplayMode;
  isMeasureOpen: boolean;    // panel MEASURE terbuka?
  isCursorActive: boolean;

  // Cursor (ΔV dan ΔT)
  cursorA: number;           // position (0~1 relative to screen)
  cursorB: number;

  // Autoset sedang berjalan
  isAutosetting: boolean;
}

// Nilai default sesuai power-on oscilloscope nyata
export const VOLTS_PER_DIV_STEPS = [
  0.002, 0.005, 0.01, 0.02, 0.05,
  0.1,   0.2,   0.5,  1,    2,    5, 10
];

export const TIME_PER_DIV_STEPS = [
  1e-9,  2.5e-9, 5e-9,
  1e-8,  2.5e-8, 5e-8,
  1e-7,  2.5e-7, 5e-7,
  1e-6,  2.5e-6, 5e-6,
  1e-5,  2.5e-5, 5e-5,
  1e-4,  2.5e-4, 5e-4,
  1e-3,  2.5e-3, 5e-3,
  0.01,  0.025,  0.05,
  0.1,   0.25,   0.5,
  1,     2.5,    5, 10, 25, 50
];

export const DEFAULT_OSC_CHANNEL: OscChannelState = {
  isEnabled: true,
  coupling: 'DC',
  voltsPerDiv: 1,
  position: 0,
  probeAttenuation: 10,
  isInverted: false,
};

export const DEFAULT_OSC_STATE: OscState = {
  isPowered: false,
  ch1: { ...DEFAULT_OSC_CHANNEL, isEnabled: true },
  ch2: { ...DEFAULT_OSC_CHANNEL, isEnabled: false },
  mathEnabled: false,
  mathOperation: null,
  timePerDiv: 0.001,         // 1 ms/div
  horizontalPosition: 0,
  triggerSource: 'CH1',
  triggerMode: 'Auto',
  triggerCoupling: 'DC',
  triggerLevel: 0,
  isRunning: true,
  acquisitionMode: 'Normal',
  averageCount: 16,
  displayMode: 'Main',
  isMeasureOpen: false,
  isCursorActive: false,
  cursorA: 0.25,
  cursorB: 0.75,
  isAutosetting: false,
};

// GFC-8010H — Digital Frequency Counter
// Manual: GFC-8010H User Manual
export type GFCGateTime = 0.1 | 1 | 10;      // seconds
export type GFCAttenuation = '1/1' | '1/10';
export type GFCMode = 'FREQ' | 'PRID';        // frequency atau period

export interface GFCState {
  // POWER
  isPowered: boolean;

  // ATT — attenuator (nomor 2 di panel)
  attenuation: GFCAttenuation;

  // LPF — low pass filter 100kHz (nomor 3)
  lpfEnabled: boolean;

  // FREQ/PRID — mode pengukuran (nomor 4)
  mode: GFCMode;

  // Gate Time (nomor 5)
  gateTime: GFCGateTime;

  // Display — nilai frekuensi yang ditampilkan (hasil pengukuran)
  displayValue: number;      // Hz
  isOverflow: boolean;       // OVER LED
  isUpdating: boolean;       // sedang dalam gate time

  // Internal: buffer sinyal input untuk diukur
  lastMeasuredAt: number;    // timestamp ms
}

export const DEFAULT_GFC_STATE: GFCState = {
  isPowered: false,
  attenuation: '1/10',
  lpfEnabled: false,
  mode: 'FREQ',
  gateTime: 1,
  displayValue: 0,
  isOverflow: false,
  isUpdating: false,
  lastMeasuredAt: 0,
};

// ─────────────────────────────────────────────────────────────
// PUDAK Module — placeholder sampai kode alat diketahui
// ─────────────────────────────────────────────────────────────

export type PudakModuleType = 'am' | 'fm' | 'demodulasi' | 'digital' | 'sample_hold' | 'mux';

export interface PudakState {
  moduleType: PudakModuleType;
  isPowered: boolean;
  // Parameter spesifik per modul (diisi saat kode PUDAK tersedia)
  params: Record<string, number | boolean | string>;
}

export const DEFAULT_PUDAK_STATE: PudakState = {
  moduleType: 'am',
  isPowered: false,
  params: {},
};