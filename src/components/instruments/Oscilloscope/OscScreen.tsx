'use client';

import { useRef, useEffect, useCallback } from 'react';
import { OscChannelState } from '../../../types/instruments';

// Warna per channel (sesuai standar lab)
export const CH_COLORS = {
  ch1: '#FACC15',   // kuning
  ch2: '#60A5FA',   // biru
  math: '#FB923C',  // oranye
};

const GRID_COLS = 10;
const GRID_ROWS = 8;
const SUB_DIVISIONS = 5;    // 5 sub-division per div

interface OscScreenProps {
  ch1Signal?: Float32Array | null;
  ch2Signal?: Float32Array | null;
  ch1State: OscChannelState;
  ch2State: OscChannelState;
  timePerDiv: number;        // seconds/div
  sampleRate?: number;
  triggerLevel?: number;
  isRunning?: boolean;
  width?: number;
  height?: number;
  showMeasurements?: boolean;
}

export default function OscScreen({
  ch1Signal, ch2Signal,
  ch1State, ch2State,
  timePerDiv,
  sampleRate = 100_000,
  triggerLevel = 0,
  isRunning = true,
  width = 400,
  height = 280,
  showMeasurements = false,
}: OscScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const frozenRef = useRef<{ ch1?: Float32Array; ch2?: Float32Array }>({});

  // Simpan sinyal terakhir saat RUN, freeze saat STOP
  if (isRunning) {
    if (ch1Signal) frozenRef.current.ch1 = ch1Signal;
    if (ch2Signal) frozenRef.current.ch2 = ch2Signal;
  }

  // Draw grid
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const cellW = w / GRID_COLS;
    const cellH = h / GRID_ROWS;

    // Background
    ctx.fillStyle = '#0A0F0A';
    ctx.fillRect(0, 0, w, h);

    // Sub-division ticks (setiap 1/5 dari satu div)
    ctx.strokeStyle = 'rgba(74,222,128,0.08)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);

    for (let col = 0; col <= GRID_COLS * SUB_DIVISIONS; col++) {
      const x = (col / (GRID_COLS * SUB_DIVISIONS)) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let row = 0; row <= GRID_ROWS * SUB_DIVISIONS; row++) {
      const y = (row / (GRID_ROWS * SUB_DIVISIONS)) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Main grid lines
    ctx.strokeStyle = 'rgba(74,222,128,0.18)';
    ctx.lineWidth = 0.7;

    for (let col = 0; col <= GRID_COLS; col++) {
      const x = col * cellW;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let row = 0; row <= GRID_ROWS; row++) {
      const y = row * cellH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center crosshair (tebal)
    ctx.strokeStyle = 'rgba(74,222,128,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Tick marks di center lines
    ctx.strokeStyle = 'rgba(74,222,128,0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_COLS * SUB_DIVISIONS; i++) {
      const x = (i / (GRID_COLS * SUB_DIVISIONS)) * w;
      const tickH = i % SUB_DIVISIONS === 0 ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(x, h / 2 - tickH / 2);
      ctx.lineTo(x, h / 2 + tickH / 2);
      ctx.stroke();
    }
    for (let i = 0; i <= GRID_ROWS * SUB_DIVISIONS; i++) {
      const y = (i / (GRID_ROWS * SUB_DIVISIONS)) * h;
      const tickW = i % SUB_DIVISIONS === 0 ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(w / 2 - tickW / 2, y);
      ctx.lineTo(w / 2 + tickW / 2, y);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = 'rgba(74,222,128,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }, []);

  // Draw satu channel
  const drawChannel = useCallback((
    ctx: CanvasRenderingContext2D,
    signal: Float32Array,
    chState: OscChannelState,
    color: string,
    w: number,
    h: number,
  ) => {
    if (!chState.isEnabled || signal.length === 0) return;

    const { voltsPerDiv, position, probeAttenuation, isInverted } = chState;
    const effectiveVpd = voltsPerDiv * probeAttenuation;

    // Hitung berapa sample yang mewakili tampilan layar
    const totalTimeSec = timePerDiv * GRID_COLS;
    const samplesNeeded = Math.floor(totalTimeSec * sampleRate);
    const samplesAvail  = signal.length;
    const samples = Math.min(samplesNeeded, samplesAvail);

    const centerY   = h / 2 - position * (h / GRID_ROWS);
    const scaleY    = (h / GRID_ROWS) / effectiveVpd;  // px per volt
    const stepX     = w / samples;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 2;
    ctx.beginPath();

    for (let i = 0; i < samples; i++) {
      const sample = isInverted ? -signal[i] : signal[i];
      const x = i * stepX;
      const y = centerY - sample * scaleY;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }

    ctx.stroke();
    ctx.restore();

    // Channel label (CH1 / CH2)
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = 'bold 9px monospace';
    const labelX = color === CH_COLORS.ch1 ? 4 : w - 24;
    ctx.fillText(color === CH_COLORS.ch1 ? 'CH1' : 'CH2', labelX, h - 4);
    ctx.restore();

    // Position indicator (segitiga kecil di sisi kiri)
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    const markerY = Math.max(6, Math.min(h - 6, centerY));
    ctx.moveTo(0, markerY);
    ctx.lineTo(6, markerY - 4);
    ctx.lineTo(6, markerY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [timePerDiv, sampleRate]);

  // Draw trigger level
  const drawTrigger = useCallback((
    ctx: CanvasRenderingContext2D, w: number, h: number,
  ) => {
    const ch1Vpd = ch1State.voltsPerDiv * ch1State.probeAttenuation;
    const centerY = h / 2 - ch1State.position * (h / GRID_ROWS);
    const scaleY = (h / GRID_ROWS) / ch1Vpd;
    const trigY = centerY - triggerLevel * scaleY;

    ctx.save();
    ctx.strokeStyle = 'rgba(252,211,77,0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(8, trigY);
    ctx.lineTo(w, trigY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Trigger arrow
    ctx.fillStyle = '#FCD34D';
    ctx.beginPath();
    ctx.moveTo(8, trigY);
    ctx.lineTo(0, trigY - 4);
    ctx.lineTo(0, trigY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [ch1State, triggerLevel]);

  // Main render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    drawGrid(ctx, w, h);

    const s1 = isRunning ? ch1Signal : frozenRef.current.ch1;
    const s2 = isRunning ? ch2Signal : frozenRef.current.ch2;

    if (s1) drawChannel(ctx, s1, ch1State, CH_COLORS.ch1, w, h);
    if (s2) drawChannel(ctx, s2, ch2State, CH_COLORS.ch2, w, h);

    drawTrigger(ctx, w, h);

    // STOP overlay
    if (!isRunning) {
      ctx.save();
      ctx.fillStyle = 'rgba(239,68,68,0.15)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('STOP', w - 36, 14);
      ctx.restore();
    }
  }, [ch1Signal, ch2Signal, ch1State, ch2State, isRunning,
      drawGrid, drawChannel, drawTrigger]);

  // Animation loop
  useEffect(() => {
    const loop = () => {
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  return (
    <div style={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          imageRendering: 'crisp-edges',
          borderRadius: 2,
        }}
      />
      {/* Overlay refleksi layar (estetika) */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
        borderRadius: 2,
      }} />
    </div>
  );
}