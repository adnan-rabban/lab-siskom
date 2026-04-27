// ============================================================
// Signal Engine Type Definitions
// ============================================================

/** Waveform shapes available in generators and signal sources */
export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

/** Coupling mode for oscilloscope channels */
export type CouplingMode = 'AC' | 'DC' | 'GND';

/** Port direction */
export type PortDirection = 'input' | 'output';

// ============================================================
// Signal Node System
// ============================================================

/** A single I/O port on a module */
export interface Port {
  id: string;
  label: string;
  labelId?: string; // Indonesian label
  direction: PortDirection;
  nodeId: string;
}

/** Parameters for a signal node (frequency, amplitude, etc.) */
export interface SignalParams {
  frequency?: number;      // Hz (real value, e.g. 455000)
  amplitude?: number;      // Volts peak
  waveform?: WaveformType;
  dcOffset?: number;       // Volts
  modulationIndex?: number; // 0..1+ for AM
  freqDeviation?: number;  // Hz, for FM
  attenuation?: number;    // dB
  gain?: number;           // linear multiplier
  tunedFrequency?: number; // Hz, for tuned circuit
  bandwidth?: number;      // Hz, Q factor
  enabled?: boolean;
  [key: string]: number | string | boolean | undefined;
}

/** A node in the signal processing graph */
export interface SignalNode {
  id: string;
  type: 'source' | 'processor' | 'output' | 'instrument';
  moduleType: ModuleType;
  label: string;
  params: SignalParams;
  ports: Port[];
}

/** Available module types */
export type ModuleType =
  | 'power-supply'
  | 'signal-source'
  | 'amplifier'
  | 'tuned-circuit'
  | 'waveform-synthesis'
  | 'fm-modulator'
  | 'detector'
  | 'data-source'
  | 'data-receiver'
  | 'audio-module'
  | 'sample-hold-mux'
  | 'function-generator'
  | 'oscilloscope'
  | 'frequency-counter';

// ============================================================
// Connection System
// ============================================================

/** A wire connection between two ports */
export interface Connection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  connected: boolean;
}

/** Connection validation result */
export interface ConnectionValidation {
  valid: boolean;
  reason?: string;
}

// ============================================================
// Practicum Configuration Schema
// ============================================================

/** A step in the lab procedure */
export interface ProcedureStep {
  stepNumber: number;
  instruction: string;
  instructionId: string; // Indonesian version
  /** Which connections should be active for this step */
  requiredConnections?: string[]; // connection IDs
  /** Parameter changes to apply */
  paramChanges?: { nodeId: string; params: Partial<SignalParams> }[];
  /** What to observe */
  observation?: string;
  observationId?: string;
}

/** An observation target that students should measure */
export interface ObservationTarget {
  id: string;
  label: string;
  labelId: string;
  unit: string;
  expectedValue?: number;
  tolerance?: number; // percentage
}

/** Grading criteria for future assessment */
export interface GradingCriteria {
  id: string;
  description: string;
  maxPoints: number;
  evaluator: 'auto' | 'manual';
}

/** Complete practicum configuration */
export interface PracticumConfig {
  id: string;
  title: string;
  titleId: string; // Indonesian
  moduleCode: string; // e.g. "TE02005"
  description: string;
  descriptionId: string;
  category: 'analog' | 'digital';
  status: 'available' | 'coming-soon';

  /** Modules required for this practicum */
  requiredModules: {
    moduleType: ModuleType;
    nodeId: string;
    label: string;
    initialParams: SignalParams;
  }[];

  /** Instruments required */
  requiredInstruments: {
    moduleType: ModuleType;
    nodeId: string;
    label: string;
    count?: number; // e.g. 2 function generators
  }[];

  /** Pre-configured connections */
  requiredConnections: Omit<Connection, 'connected'>[];

  /** Step-by-step procedure */
  procedure: ProcedureStep[];

  /** What students should measure */
  observationTargets: ObservationTarget[];

  /** Optional grading */
  gradingCriteria?: GradingCriteria[];
}

// ============================================================
// Oscilloscope Types
// ============================================================

export interface OscilloscopeChannel {
  id: 'CH1' | 'CH2';
  enabled: boolean;
  coupling: CouplingMode;
  voltsPerDiv: number;   // V/div
  verticalOffset: number; // divisions
  connectedTo: string | null; // portId
  color: string;
}

export interface OscilloscopeState {
  channels: [OscilloscopeChannel, OscilloscopeChannel];
  timePerDiv: number;     // seconds/div
  triggerLevel: number;
  triggerSource: 'CH1' | 'CH2' | 'EXT';
  horizontalOffset: number;
  running: boolean;
  cursorMode: 'off' | 'time' | 'voltage';
  cursorPositions: {
    t1: number; // normalized units or divisions
    t2: number;
    v1: number; // normalized units or divisions
    v2: number;
  };
}

// ============================================================
// Measurement Table
// ============================================================

export interface MeasurementRow {
  id: string;
  label: string;
  fields: {
    fieldId: string;
    fieldLabel: string;
    unit: string;
    value: string;
    expected?: number;
  }[];
  calculated?: {
    fieldId: string;
    fieldLabel: string;
    unit: string;
    formula: string; // display formula
    compute: (fields: Record<string, number>) => number;
  }[];
}

// ============================================================
// i18n
// ============================================================

export type Language = 'id' | 'en';

export interface TranslationStrings {
  [key: string]: {
    id: string;
    en: string;
  };
}
