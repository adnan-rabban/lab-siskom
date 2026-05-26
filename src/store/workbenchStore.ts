import { create } from 'zustand';
import { Cable, Port, InstrumentId } from '../lib/signal/types';
import { ConnectionValidation, makePortId, getCableColor } from '../types/signals';
import { AFGState, OscState, GFCState, PudakState,
         DEFAULT_AFG_STATE, DEFAULT_OSC_STATE, DEFAULT_GFC_STATE } from '../types/instruments';

// Posisi instrumen di canvas
export interface InstrumentPosition {
  instrumentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Kabel aktif di workbench
export interface ActiveCable extends Cable {
  // Posisi absolut ujung kabel (untuk render SVG)
  // Dihitung dari posisi instrumen + relativeX/Y port
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

// State dragging kabel (saat user sedang tarik kabel)
export interface DraggingCable {
  fromPortId: string;
  fromX: number;
  fromY: number;
  currentX: number;
  currentY: number;
  color: import('../lib/signal/types').CableColor;
}

// State store
interface WorkbenchState {
  // Zoom & Pan
  zoom: number;             // 0.3 ~ 2.0
  panX: number;             // pixel offset
  panY: number;

  // Instrumen
  positions: Record<string, InstrumentPosition>;

  // State masing-masing instrumen
  afg1: AFGState;
  afg2: AFGState;
  osc: OscState;
  gfc: GFCState;
  pudak: PudakState | null;

  // Kabel
  cables: ActiveCable[];
  dragging: DraggingCable | null;

  // Port registry
  ports: Record<string, Port>;

  // Actions

  // Zoom
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;

  // Pan
  setPan: (x: number, y: number) => void;

  // Instrumen - posisi
  setPosition: (instrumentId: string, x: number, y: number) => void;

  // Instrumen - state
  updateAFG: (instanceId: 'afg1' | 'afg2', patch: Partial<AFGState>) => void;
  updateOsc: (patch: Partial<OscState>) => void;
  updateGFC: (patch: Partial<GFCState>) => void;

  // Kabel
  startDragging: (portId: string, x: number, y: number) => void;
  updateDragging: (x: number, y: number) => void;
  finishDragging: (toPortId: string) => ConnectionValidation;
  cancelDragging: () => void;
  removeCable: (cableId: string) => void;
  removeAllCables: () => void;

  // Validasi koneksi
  validateConnection: (fromPortId: string, toPortId: string) => ConnectionValidation;

  // Update posisi ujung kabel saat instrumen dipindah
  recalculateCablePositions: () => void;

  // Reset workbench ke kondisi awal modul
  resetWorkbench: () => void;

  // Register port ke registry
  registerPort: (port: Port) => void;
}

// Ukuran instrumen default
const INSTRUMENT_SIZES: Record<string, { width: number; height: number }> = {
  afg1:    { width: 420, height: 180 },
  afg2:    { width: 420, height: 180 },
  osc:     { width: 500, height: 280 },
  gfc:     { width: 380, height: 130 },
  pudak:   { width: 320, height: 200 },
};

// Posisi default saat modul pertama dibuka
const DEFAULT_POSITIONS: Record<string, InstrumentPosition> = {
  afg1: { instrumentId: 'afg1', x: 40,  y: 80,  ...INSTRUMENT_SIZES.afg1 },
  afg2: { instrumentId: 'afg2', x: 40,  y: 300, ...INSTRUMENT_SIZES.afg2 },
  osc:  { instrumentId: 'osc',  x: 520, y: 80,  ...INSTRUMENT_SIZES.osc  },
  gfc:  { instrumentId: 'gfc',  x: 520, y: 400, ...INSTRUMENT_SIZES.gfc  },
  pudak:{ instrumentId: 'pudak',x: 220, y: 200, ...INSTRUMENT_SIZES.pudak },
};

const ZOOM_STEP = 0.15;
const ZOOM_MIN  = 0.3;
const ZOOM_MAX  = 2.0;

// Store
export const useWorkbenchStore = create<WorkbenchState>()((set, get) => ({
  zoom: 1,
  panX: 0,
  panY: 0,
  positions: { ...DEFAULT_POSITIONS },
  afg1: { ...DEFAULT_AFG_STATE, instanceId: 'afg1' },
  afg2: { ...DEFAULT_AFG_STATE, instanceId: 'afg2', frequency: 500 },
  osc:  { ...DEFAULT_OSC_STATE },
  gfc:  { ...DEFAULT_GFC_STATE },
  pudak: null,
  cables: [],
  dragging: null,
  ports: {},

  // Zoom
  setZoom: (zoom) =>
    set({ zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)) }),

  zoomIn: () =>
    set(s => ({ zoom: Math.min(ZOOM_MAX, +(s.zoom + ZOOM_STEP).toFixed(2)) })),

  zoomOut: () =>
    set(s => ({ zoom: Math.max(ZOOM_MIN, +(s.zoom - ZOOM_STEP).toFixed(2)) })),

  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),

  // Pan
  setPan: (x, y) => set({ panX: x, panY: y }),

  // Posisi instrumen
  setPosition: (instrumentId, x, y) =>
    set(s => ({
      positions: {
        ...s.positions,
        [instrumentId]: { ...s.positions[instrumentId], x, y },
      },
    })),

  // Update state instrumen
  updateAFG: (instanceId, patch) =>
    set(s => ({ [instanceId]: { ...s[instanceId], ...patch } })),

  updateOsc: (patch) =>
    set(s => ({ osc: { ...s.osc, ...patch } })),

  updateGFC: (patch) =>
    set(s => ({ gfc: { ...s.gfc, ...patch } })),

  // Drag kabel
  startDragging: (portId, x, y) => {
    set({
      dragging: {
        fromPortId: portId,
        fromX: x, fromY: y,
        currentX: x, currentY: y,
        color: 'yellow',
      },
    });
  },

  updateDragging: (x, y) =>
    set(s => s.dragging ? { dragging: { ...s.dragging, currentX: x, currentY: y } } : {}),

  finishDragging: (toPortId) => {
    const { dragging, validateConnection } = get();
    if (!dragging) {
      return { isValid: false, error: 'type_mismatch', message: 'Tidak ada kabel yang sedang ditarik.' };
    }

    const validation = validateConnection(dragging.fromPortId, toPortId);

    if (validation.isValid) {
      const newCable: ActiveCable = {
        id: `cable_${Date.now()}`,
        fromPortId: dragging.fromPortId,
        toPortId,
        color: getCableColor(dragging.fromPortId, toPortId),
        fromX: dragging.fromX,
        fromY: dragging.fromY,
        toX: dragging.currentX,
        toY: dragging.currentY,
      };
      set(s => ({ cables: [...s.cables, newCable], dragging: null }));
    } else {
      set({ dragging: null });
    }

    return validation;
  },

  cancelDragging: () => set({ dragging: null }),

  removeCable: (cableId) =>
    set(s => ({ cables: s.cables.filter(c => c.id !== cableId) })),

  removeAllCables: () => set({ cables: [] }),

  // Validasi koneksi
  validateConnection: (fromPortId, toPortId) => {
    const { cables, ports } = get();

    // Tidak bisa konek ke diri sendiri
    const fromInstrument = fromPortId.split('_')[0];
    const toInstrument = toPortId.split('_')[0];
    if (fromInstrument === toInstrument) {
      return { isValid: false, error: 'same_instrument', message: 'Tidak bisa menghubungkan port pada instrumen yang sama.' };
    }

    // Cek apakah port sudah punya kabel
    const portOccupied = cables.some(
      c => c.fromPortId === toPortId || c.toPortId === toPortId
    );
    if (portOccupied) {
      return { isValid: false, error: 'already_connected', message: 'Port sudah terhubung. Cabut kabel dulu.' };
    }

    return { isValid: true, error: null, message: 'Koneksi valid.' };
  },

  // Recalculate posisi kabel
  recalculateCablePositions: () => {
    // Akan di-implement di Fase 3 saat CableLayer sudah ada
    // (membutuhkan ref ke DOM element port)
  },

  // Register port
  registerPort: (port) =>
    set(s => ({ ports: { ...s.ports, [port.id]: port } })),

  // Reset workbench
  resetWorkbench: () =>
    set({
      zoom: 1,
      panX: 0,
      panY: 0,
      positions: { ...DEFAULT_POSITIONS },
      afg1: { ...DEFAULT_AFG_STATE, instanceId: 'afg1' },
      afg2: { ...DEFAULT_AFG_STATE, instanceId: 'afg2', frequency: 500 },
      osc:  { ...DEFAULT_OSC_STATE },
      gfc:  { ...DEFAULT_GFC_STATE },
      cables: [],
      dragging: null,
    }),
}));

// Selector helpers
export const selectZoom   = (s: WorkbenchState) => s.zoom;
export const selectCables = (s: WorkbenchState) => s.cables;
export const selectAFG    = (id: 'afg1' | 'afg2') => (s: WorkbenchState) => s[id];
export const selectOsc    = (s: WorkbenchState) => s.osc;
export const selectGFC    = (s: WorkbenchState) => s.gfc;
export const selectDragging = (s: WorkbenchState) => s.dragging;