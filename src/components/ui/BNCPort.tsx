'use client';

import { useRef, useCallback } from 'react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import { useWorkbench } from '../workbench/WorkbenchContext';

interface BNCPortProps {
  portId: string;
  label?: string;
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
  size?: number;           // diameter px, default 18
  isConnected?: boolean;
  isOutput?: boolean;      // true = output port (kuning), false = input (putih)
  disabled?: boolean;
  className?: string;
}

export default function BNCPort({
  portId, label, labelPosition = 'bottom',
  size = 18, isConnected = false, isOutput = false,
  disabled = false, className = '',
}: BNCPortProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { startDragging, finishDragging, cancelDragging, dragging } = useWorkbenchStore();

  const isBeingDraggedFrom = dragging?.fromPortId === portId;
  const canReceive = dragging && dragging.fromPortId !== portId && !disabled;

  // Mulai drag kabel
  const { toCanvas } = useWorkbench();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    // Konversi posisi center port dari screen → canvas coordinates
    const screenX = rect.left + rect.width / 2;
    const screenY = rect.top + rect.height / 2;
    const canvasPos = toCanvas(screenX, screenY);
    startDragging(portId, canvasPos.x, canvasPos.y);
  }, [portId, disabled, startDragging, toCanvas]);

  // Terima kabel dari port lain
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragging || dragging.fromPortId === portId) return;
    e.stopPropagation();
    finishDragging(portId);
  }, [portId, dragging, finishDragging]);

  // Warna port berdasarkan state
  const getPortColor = () => {
    if (disabled)          return '#374151';
    if (isBeingDraggedFrom) return '#FCD34D';
    if (canReceive)         return '#86EFAC';
    if (isConnected)        return isOutput ? '#FCD34D' : '#93C5FD';
    return isOutput ? '#6B7280' : '#4B5563';
  };

  const borderColor = canReceive ? '#4ADE80' : isConnected ? '#9CA3AF' : '#374151';

  const labelStyle: React.CSSProperties = {
    fontSize: 8,
    color: '#6B7280',
    whiteSpace: 'nowrap',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    userSelect: 'none',
    pointerEvents: 'none',
  };

  const labelEl = label ? <span style={labelStyle}>{label}</span> : null;

  return (
    <div
      className={`flex flex-col items-center gap-0.5 ${className}`}
      style={{ flexDirection: labelPosition === 'top' ? 'column-reverse' : 'column' }}
    >
      {(labelPosition === 'top' || labelPosition === 'bottom') && labelEl}

      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {labelPosition === 'right' && labelEl}

        {/* Port body */}
        <div
          ref={ref}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: getPortColor(),
            border: `2px solid ${borderColor}`,
            cursor: disabled ? 'not-allowed' : canReceive ? 'cell' : 'crosshair',
            boxShadow: canReceive
              ? `0 0 0 3px rgba(74,222,128,0.3)`
              : isBeingDraggedFrom
              ? `0 0 0 3px rgba(252,211,77,0.4)`
              : isConnected
              ? 'inset 0 1px 3px rgba(0,0,0,0.5)'
              : 'inset 0 2px 4px rgba(0,0,0,0.6)',
            position: 'relative',
            transition: 'box-shadow 0.1s, background-color 0.1s',
            flexShrink: 0,
          }}
        >
          {/* Inner hole / pin */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 0.35,
            height: size * 0.35,
            borderRadius: '50%',
            backgroundColor: isConnected ? '#1F2937' : '#111827',
            border: '1px solid #374151',
          }} />

          {/* Outer ridges (BNC style) */}
          <div style={{
            position: 'absolute',
            inset: -3,
            borderRadius: '50%',
            border: '1px solid #1F2937',
            pointerEvents: 'none',
          }} />
        </div>

        {labelPosition === 'left' && labelEl}
      </div>
    </div>
  );
}