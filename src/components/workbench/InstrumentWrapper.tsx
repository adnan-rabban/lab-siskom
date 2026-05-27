'use client';

import { useRef, useCallback, useEffect, useState, ReactNode } from 'react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import { useWorkbench } from './WorkbenchContext';

interface InstrumentWrapperProps {
  instrumentId: string;
  title: string;
  children: ReactNode;
  defaultX?: number;
  defaultY?: number;
  zIndex?: number;
}

export default function InstrumentWrapper({
  instrumentId,
  title,
  children,
  zIndex = 10,
}: InstrumentWrapperProps) {
  const { positions, setPosition } = useWorkbenchStore();
  const { transform } = useWorkbench();
  const pos = positions[instrumentId] ?? { x: 0, y: 0 };

  const dragRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  // Mouse down pada title bar
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    dragRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
    setIsDragging(true);
    setIsSelected(true);
  }, [pos.x, pos.y]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = (e.clientX - dragRef.current.startMouseX) / transform.zoom;
      const dy = (e.clientY - dragRef.current.startMouseY) / transform.zoom;
      setPosition(
        instrumentId,
        dragRef.current.startPosX + dx,
        dragRef.current.startPosY + dy,
      );
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, instrumentId, setPosition, transform.zoom]);

  // Deselect saat klik di luar
  useEffect(() => {
    const handler = () => setIsSelected(false);
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        zIndex: isDragging || isSelected ? zIndex + 5 : zIndex,
        filter: isSelected ? 'drop-shadow(0 0 12px rgba(99,102,241,0.4))' : undefined,
        transition: isDragging ? 'none' : 'filter 0.2s',
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        setIsSelected(true);
      }}
    >
      {/* Drag handle bar */}
      <div
        onMouseDown={handleDragStart}
        style={{
          height: 14,
          backgroundColor: isSelected ? '#312E81' : '#1E293B',
          borderRadius: '5px 5px 0 0',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          borderBottom: '1px solid #334155',
          transition: 'background-color 0.15s',
          userSelect: 'none',
        }}
      >
        {/* Grip dots */}
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            width: 3,
            height: 3,
            borderRadius: '50%',
            backgroundColor: isSelected ? '#818CF8' : '#475569',
          }} />
        ))}
      </div>

      {/* Instrument component */}
      <div style={{ borderRadius: '0 0 5px 5px', overflow: 'visible' }}>
        {children}
      </div>

      {/* Selected border glow */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          inset: -2,
          borderRadius: 7,
          border: '1px solid rgba(99,102,241,0.5)',
          pointerEvents: 'none',
          boxShadow: '0 0 0 1px rgba(99,102,241,0.2)',
        }} />
      )}
    </div>
  );
}