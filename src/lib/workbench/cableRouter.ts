import { Vec2, INSTRUMENT_PORT_OFFSETS, parsePortId, getInstrumentType } from './workbench.types';

// Ambil posisi port di canvas (world coordinates)
// positions: Record<instrumentId, {x, y}> dari workbenchStore
export function getPortWorldPosition(
  portId: string,
  positions: Record<string, { x: number; y: number }>
): Vec2 {
  const { instanceId, portName } = parsePortId(portId);
  const instrPos = positions[instanceId];
  if (!instrPos) return { x: 0, y: 0 };

  const instrType = getInstrumentType(instanceId);
  const offsets   = INSTRUMENT_PORT_OFFSETS[instrType] ?? {};
  const offset    = offsets[portName] ?? { x: 20, y: 20 };

  return {
    x: instrPos.x + offset.x,
    y: instrPos.y + offset.y,
  };
}

// Buat SVG cubic bezier path antara dua titik
// Kurva horizontal: control points mengarah horizontal dari titik asal.
// Menghasilkan kurva S yang natural untuk kabel lab.
export function buildBezierPath(from: Vec2, to: Vec2): string {
  const dx = Math.abs(to.x - from.x);
  // Tension: semakin jauh, semakin melengkung
  const tension = Math.max(dx * 0.55, 60);

  const c1x = from.x + tension;
  const c1y = from.y;
  const c2x = to.x - tension;
  const c2y = to.y;

  return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
}

// Buat path untuk kabel yang sedang di-drag (rubber band)
// from: posisi awal (port asal)
// to:   posisi cursor saat ini
export function buildDragPath(from: Vec2, to: Vec2): string {
  return buildBezierPath(from, to);
}

// Hitung midpoint bezier (untuk label / tooltip kabel)
export function getBezierMidpoint(from: Vec2, to: Vec2): Vec2 {
  const dx = Math.abs(to.x - from.x);
  const tension = Math.max(dx * 0.55, 60);

  // Titik t=0.5 pada cubic bezier
  const c1x = from.x + tension; const c1y = from.y;
  const c2x = to.x - tension;   const c2y = to.y;

  const t = 0.5;
  const mt = 1 - t;
  return {
    x: mt*mt*mt*from.x + 3*mt*mt*t*c1x + 3*mt*t*t*c2x + t*t*t*to.x,
    y: mt*mt*mt*from.y + 3*mt*mt*t*c1y + 3*mt*t*t*c2y + t*t*t*to.y,
  };
}

// Warna kabel per tipe koneksi
export function getCableStrokeColor(
  fromPortId: string,
  toPortId: string,
  opacity = 1
): string {
  const colors: Record<string, string> = {
    yellow: `rgba(250,204,21,${opacity})`,   // AFG → OSC CH1 (kuning)
    blue:   `rgba(96,165,250,${opacity})`,   // AFG → OSC CH2 (biru)
    red:    `rgba(239,68,68,${opacity})`,    // BNC generic (merah)
    green:  `rgba(74,222,128,${opacity})`,   // signal valid
    gray:   `rgba(107,114,128,${opacity})`,  // disconnected
  };

  if (toPortId.includes('ch1')) return colors.yellow;
  if (toPortId.includes('ch2')) return colors.blue;
  if (toPortId.includes('input')) return colors.red;
  if (fromPortId.includes('sync')) return colors.green;
  return colors.yellow;
}

// Cek apakah titik (px, py) dekat path SVG
// Dipakai untuk deteksi klik pada kabel.
// Approksimasi: cek jarak ke midpoint.
export function isNearCable(
  px: number, py: number,
  from: Vec2, to: Vec2,
  threshold = 12
): boolean {
  const mid = getBezierMidpoint(from, to);
  const dx = px - mid.x;
  const dy = py - mid.y;
  return Math.sqrt(dx*dx + dy*dy) < threshold;
}