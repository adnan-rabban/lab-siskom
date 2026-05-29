'use client';

import {
  useRef, useCallback, useEffect, useState,
  useMemo, RefObject, ReactNode,
} from 'react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import { WorkbenchContext } from './WorkbenchContext';
import { CanvasTransform, screenToCanvas } from '../../lib/workbench/workbench.types';
import WorkbenchGrid from './WorkbenchGrid';
import ZoomControls from './ZoomControls';
import CableLayer from './CableLayer';
import InstrumentWrapper from './InstrumentWrapper';
import FunctionGenerator from '../instruments/FunctionGenerator/FunctionGenerator';
import Oscilloscope from '../instruments/Oscilloscope/Oscilloscope';
import FrequencyCounter from '../instruments/FrequencyCounter/FrequencyCounter';

// Konfigurasi instrumen yang tampil di workbench
interface WorkbenchConfig {
  showAFG1: boolean;
  showAFG2: boolean;
  showOsc: boolean;
  showGFC: boolean;
}

const DEFAULT_CONFIG: WorkbenchConfig = {
  showAFG1: true,
  showAFG2: true,
  showOsc:  true,
  showGFC:  true,
};

interface WorkbenchCanvasProps {
  config?: Partial<WorkbenchConfig>;
  pudakSlot?: ReactNode;
}

// Toolbar atas workbench
function WorkbenchToolbar({
  onReset,
  onResetCables,
}: {
  onReset: () => void;
  onResetCables: () => void;
}) {
  return (
    <div style={{
      position: 'absolute',
      top: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 6,
      zIndex: 50,
      backgroundColor: 'rgba(15,23,42,0.85)',
      border: '1px solid #1E293B',
      borderRadius: 8,
      padding: '4px 8px',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    }}>
      {/* Hint teks */}
      <span style={{
        fontSize: 11,
        color: '#475569',
        alignSelf: 'center',
        paddingRight: 6,
        borderRight: '1px solid #1E293B',
        marginRight: 2,
      }}>
        Scroll: zoom · Drag background: pan · Drag grip: pindah alat · Drag BNC: sambung kabel
      </span>

      <button
        onClick={onResetCables}
        style={{
          fontSize: 10, padding: '3px 8px',
          backgroundColor: '#1E293B', border: '1px solid #334155',
          borderRadius: 4, color: '#94A3B8', cursor: 'pointer',
        }}
      >
        Cabut Semua
      </button>
      <button
        onClick={onReset}
        style={{
          fontSize: 10, padding: '3px 8px',
          backgroundColor: '#1E293B', border: '1px solid #334155',
          borderRadius: 4, color: '#94A3B8', cursor: 'pointer',
        }}
      >
        Reset Layout
      </button>
    </div>
  );
}

// Komponen utama
export default function WorkbenchCanvas({
  config = DEFAULT_CONFIG,
  pudakSlot,
}: WorkbenchCanvasProps) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLDivElement>(null);

  const {
    zoom, panX, panY,
    setZoom, setPan,
    resetWorkbench, removeAllCables,
    updateDragging, cancelDragging, finishDragging,
    dragging,
  } = useWorkbenchStore();

  // Drag background state (pan)
  const panDragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // Konversi koordinat
  const toCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: screenX, y: screenY };
    return screenToCanvas(screenX, screenY, rect, { panX, panY, zoom });
  }, [panX, panY, zoom]);

  const toScreen = useCallback((canvasX: number, canvasY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: canvasX, y: canvasY };
    return {
      x: canvasX * zoom + panX + rect.left,
      y: canvasY * zoom + panY + rect.top,
    };
  }, [panX, panY, zoom]);

  // Context value
  const contextValue = useMemo(() => ({
    transform: { panX, panY, zoom } as CanvasTransform,
    canvasRef: canvasRef as RefObject<HTMLDivElement | null>,
    toCanvas,
    toScreen,
  }), [panX, panY, zoom, toCanvas, toScreen]);

  // Scroll → zoom ke arah kursor
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const factor  = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const newZoom = Math.max(0.3, Math.min(2.0, zoom * factor));

    // Zoom ke arah kursor
    const mouseX   = e.clientX - rect.left;
    const mouseY   = e.clientY - rect.top;
    const worldX   = (mouseX - panX) / zoom;
    const worldY   = (mouseY - panY) / zoom;
    const newPanX  = mouseX - worldX * newZoom;
    const newPanY  = mouseY - worldY * newZoom;

    setZoom(newZoom);
    setPan(newPanX, newPanY);
  }, [zoom, panX, panY, setZoom, setPan]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Mouse down pada background → pan
  const handleBgMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-instrument]')) return;
    e.preventDefault();
    panDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: panX,
      startPanY: panY,
    };
    setIsPanning(true);
  }, [panX, panY]);

  useEffect(() => {
    if (!isPanning) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!panDragRef.current) return;
      const dx = e.clientX - panDragRef.current.startX;
      const dy = e.clientY - panDragRef.current.startY;
      setPan(panDragRef.current.startPanX + dx, panDragRef.current.startPanY + dy);
    };
    const handleMouseUp = () => {
      panDragRef.current = null;
      setIsPanning(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, setPan]);

  // Mouse move → update rubber band kabel
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const pos = toCanvas(e.clientX, e.clientY);
    updateDragging(pos.x, pos.y);
  }, [dragging, toCanvas, updateDragging]);

  // Mouse up di background → selesaikan atau batalkan
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      cancelDragging();
    }
  }, [dragging, cancelDragging]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDragging();
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        resetWorkbench();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cancelDragging, resetWorkbench]);

  return (
    <WorkbenchContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : dragging ? 'crosshair' : 'default',
          userSelect: 'none',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleBgMouseDown}
      >
        {/* Grid background (absolute, tidak ikut transform) */}
        <WorkbenchGrid panX={panX} panY={panY} zoom={zoom} />

        {/* Canvas transform div */}
        <div
          ref={canvasRef}
          data-canvas="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transformOrigin: '0 0',
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            willChange: 'transform',
          }}
        >
          {/* Instrumen */}
          {cfg.showAFG1 && (
            <div data-instrument="afg1">
              <InstrumentWrapper instrumentId="afg1" title="AFG-2025 ①" zIndex={10}>
                <FunctionGenerator instanceId="afg1" />
              </InstrumentWrapper>
            </div>
          )}

          {cfg.showAFG2 && (
            <div data-instrument="afg2">
              <InstrumentWrapper instrumentId="afg2" title="AFG-2025 ②" zIndex={10}>
                <FunctionGenerator instanceId="afg2" />
              </InstrumentWrapper>
            </div>
          )}

          {cfg.showOsc && (
            <div data-instrument="osc">
              <InstrumentWrapper instrumentId="osc" title="GDS-1102-U" zIndex={10}>
                <Oscilloscope />
              </InstrumentWrapper>
            </div>
          )}

          {cfg.showGFC && (
            <div data-instrument="gfc">
              <InstrumentWrapper instrumentId="gfc" title="GFC-8010H" zIndex={10}>
                <FrequencyCounter />
              </InstrumentWrapper>
            </div>
          )}

          {pudakSlot && (
            <div data-instrument="pudak">
              <InstrumentWrapper instrumentId="pudak" title="PUDAK Module" zIndex={10}>
                {pudakSlot}
              </InstrumentWrapper>
            </div>
          )}

          {/* Kabel layer (di atas instrumen) */}
          <CableLayer />
        </div>

        {/* UI overlay (tidak ikut transform) */}
        <WorkbenchToolbar
          onReset={resetWorkbench}
          onResetCables={removeAllCables}
        />
        <ZoomControls />

        {/* Hint saat drag kabel */}
        {dragging && (
          <div style={{
            position: 'absolute',
            bottom: 52,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(15,23,42,0.9)',
            border: '1px solid #334155',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 11,
            color: '#94A3B8',
            pointerEvents: 'none',
            zIndex: 50,
          }}>
            Arahkan ke port BNC tujuan · Esc untuk batal
          </div>
        )}
      </div>
    </WorkbenchContext.Provider>
  );
}