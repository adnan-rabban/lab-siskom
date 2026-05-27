'use client';

import { useCallback } from 'react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import {
  buildBezierPath,
  getPortWorldPosition,
  getCableStrokeColor,
  isNearCable,
} from '../../lib/workbench/cableRouter';
import { Vec2 } from '../../lib/workbench/workbench.types';
import { useSignalStore } from '../../store/signalStore';

// Warna kabel berdasarkan portId
function cableColor(fromPortId: string, toPortId: string, opacity = 1): string {
  return getCableStrokeColor(fromPortId, toPortId, opacity);
}

// Satu kabel aktif
function CablePath({
  fromPortId,
  toPortId,
  from,
  to,
  onRemove,
  hasSignal,
}: {
  fromPortId: string;
  toPortId: string;
  from: Vec2;
  to: Vec2;
  onRemove: () => void;
  hasSignal: boolean;
}) {
  const stroke = cableColor(fromPortId, toPortId, 1);
  const glow   = cableColor(fromPortId, toPortId, 0.3);
  const path   = buildBezierPath(from, to);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  }, [onRemove]);

  return (
    <g>
      {/* Glow layer */}
      <path
        d={path}
        fill="none"
        stroke={glow}
        strokeWidth={hasSignal ? 10 : 6}
        strokeLinecap="round"
        style={{ filter: hasSignal ? `drop-shadow(0 0 4px ${stroke})` : undefined }}
      />

      {/* Cable body */}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={hasSignal ? 3 : 2}
        strokeLinecap="round"
        strokeDasharray={hasSignal ? undefined : '6 4'}
        opacity={hasSignal ? 1 : 0.6}
      />

      {/* Signal flow animation saat ada sinyal */}
      {hasSignal && (
        <path
          d={path}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1}
          strokeLinecap="round"
          strokeDasharray="8 24"
          style={{ animation: 'cable-flow 1.2s linear infinite' }}
        />
      )}

      {/* Invisible hit area untuk click */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        strokeLinecap="round"
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
        onClick={handleClick}
      >
        <title>Klik untuk cabut kabel</title>
      </path>

      {/* Endpoint dots */}
      <circle cx={from.x} cy={from.y} r={4} fill={stroke} opacity={0.8} />
      <circle cx={to.x}   cy={to.y}   r={4} fill={stroke} opacity={0.8} />
    </g>
  );
}

// Rubber band saat drag
function DraggingCable({ from, to }: { from: Vec2; to: Vec2 }) {
  const path = buildBezierPath(from, to);
  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="rgba(250,204,21,0.25)"
        strokeWidth={8}
        strokeLinecap="round"
      />
      <path
        d={path}
        fill="none"
        stroke="rgba(250,204,21,0.9)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="5 4"
        style={{ animation: 'cable-flow 0.8s linear infinite' }}
      />
      {/* Cursor endpoint */}
      <circle cx={to.x} cy={to.y} r={5}
        fill="rgba(250,204,21,0.6)"
        stroke="rgba(250,204,21,1)"
        strokeWidth={1.5}
      />
    </g>
  );
}

// Komponen utama
export default function CableLayer() {
  const { cables, dragging, positions, removeCable } = useWorkbenchStore();
  const { signals } = useSignalStore();

  return (
    <>
      {/* CSS animation untuk signal flow */}
      <style>{`
        @keyframes cable-flow {
          from { stroke-dashoffset: 32; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* SVG dengan overflow visible — menggambar keluar bounds-nya */}
      <svg
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          overflow: 'visible',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        {/* Kabel aktif */}
        {cables.map(cable => {
          const from = getPortWorldPosition(cable.fromPortId, positions);
          const to   = getPortWorldPosition(cable.toPortId,   positions);

          // Cek apakah sinyal mengalir
          const sig = signals[cable.fromPortId];
          const hasSignal = !!sig && sig.params.amplitude > 0;

          return (
            <CablePath
              key={cable.id}
              fromPortId={cable.fromPortId}
              toPortId={cable.toPortId}
              from={from}
              to={to}
              hasSignal={hasSignal}
              onRemove={() => removeCable(cable.id)}
            />
          );
        })}

        {/* Rubber band kabel saat drag */}
        {dragging && (
          <DraggingCable
            from={{ x: dragging.fromX, y: dragging.fromY }}
            to={{ x: dragging.currentX, y: dragging.currentY }}
          />
        )}
      </svg>
    </>
  );
}