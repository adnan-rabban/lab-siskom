// Transform kanvas
export interface CanvasTransform {
  panX: number;
  panY: number;
  zoom: number;
}

// Posisi 2D
export interface Vec2 {
  x: number;
  y: number;
}

// Offset port relatif terhadap pojok kiri-atas instrumen
export interface PortOffset extends Vec2 {
  portId: string;
  label: string;
}

// Port world position (koordinat dalam canvas)
export interface PortWorldPos extends Vec2 {
  portId: string;
}

// Ukuran instrumen
export interface InstrumentSize {
  width: number;
  height: number;
}

// Definisi posisi port tiap instrumen
// Koordinat relatif terhadap pojok kiri-atas panel instrumen.
// Diukur berdasarkan layout komponen React yang sudah dibuat.

export const INSTRUMENT_PORT_OFFSETS: Record<string, Record<string, Vec2>> = {
  // AFG-2025: width ~460, height ~180
  // BNC ports di sisi kanan
  afg: {
    sync_out: { x: 452, y: 66  },   // SYNC OUTPUT atas
    main_out: { x: 452, y: 122 },   // MAIN OUTPUT bawah
  },

  // GDS-1102-U: width ~560, height ~340
  // BNC ports di bagian bawah
  osc: {
    ch1:      { x: 76,  y: 332 },
    ch2:      { x: 144, y: 332 },
    ext_trig: { x: 200, y: 332 },
  },

  // GFC-8010H: width ~440, height ~140
  // INPUT BNC di sisi kiri
  gfc: {
    input: { x: 46, y: 78 },
  },

  // PUDAK: ports bervariasi, placeholder dulu
  pudak: {
    input_a:    { x: 16,  y: 60  },
    input_b:    { x: 16,  y: 100 },
    carrier_in: { x: 16,  y: 60  },
    message_in: { x: 16,  y: 100 },
    output:     { x: 304, y: 80  },
    mod_out:    { x: 304, y: 80  },
  },
};

// Helper: ambil instrument type dari instanceId
// e.g. 'afg1' → 'afg', 'afg2' → 'afg', 'osc' → 'osc'
export function getInstrumentType(instanceId: string): string {
  return instanceId.replace(/\d+$/, '');
}

// Helper: parse portId → {instanceId, portName}
// e.g. 'afg1_main_out' → { instanceId: 'afg1', portName: 'main_out' }
export function parsePortId(portId: string): { instanceId: string; portName: string } {
  const knownIds = ['afg1', 'afg2', 'osc', 'gfc', 'pudak'];
  for (const id of knownIds) {
    if (portId.startsWith(id + '_')) {
      return { instanceId: id, portName: portId.slice(id.length + 1) };
    }
  }
  // Fallback
  const idx = portId.indexOf('_');
  return {
    instanceId: idx >= 0 ? portId.slice(0, idx) : portId,
    portName:   idx >= 0 ? portId.slice(idx + 1) : '',
  };
}

// Konversi koordinat screen → canvas
export function screenToCanvas(
  screenX: number,
  screenY: number,
  canvasRect: DOMRect,
  transform: CanvasTransform
): Vec2 {
  return {
    x: (screenX - canvasRect.left - transform.panX) / transform.zoom,
    y: (screenY - canvasRect.top  - transform.panY) / transform.zoom,
  };
}

// Konversi koordinat canvas → screen
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  canvasRect: DOMRect,
  transform: CanvasTransform
): Vec2 {
  return {
    x: canvasX * transform.zoom + transform.panX + canvasRect.left,
    y: canvasY * transform.zoom + transform.panY + canvasRect.top,
  };
}