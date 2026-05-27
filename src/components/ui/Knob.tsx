'use client';

// UI — Knob
// Rotary knob berbasis SVG. Drag vertikal = putar knob.
// Dipakai: VOLTS/DIV, TIME/DIV, FREQ, AMPL, TRIGGER LEVEL, dll.

import { useRef, useCallback, useEffect, useState } from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  steps?: number[];          // snap ke nilai tertentu (e.g. VOLTS/DIV steps)
  size?: number;             // diameter px, default 44
  label?: string;
  unit?: string;
  color?: string;            // warna indikator, default '#4ADE80'
  sensitivity?: number;      // px per step, default 2
  onChange: (value: number) => void;
  disabled?: boolean;
  formatValue?: (v: number) => string;
}

// Sudut awal dan akhir knob (dalam radian, -135° ~ +135°)
const START_ANGLE = -2.356; // -135° dalam radian
const END_ANGLE   =  2.356; // +135°
const TOTAL_ANGLE = END_ANGLE - START_ANGLE;

export default function Knob({
  value, min, max, step = 1, steps,
  size = 44, label, unit, color = '#4ADE80',
  sensitivity = 2, onChange, disabled = false,
  formatValue,
}: KnobProps) {
  const dragRef  = useRef<{ startY: number; startValue: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Konversi value → sudut
  const valueToAngle = (v: number) => {
    const norm = (v - min) / (max - min);
    return START_ANGLE + norm * TOTAL_ANGLE;
  };

  // Snap ke steps array terdekat
  const snapToSteps = useCallback((v: number): number => {
    if (!steps || steps.length === 0) return v;
    return steps.reduce((prev, curr) =>
      Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev
    );
  }, [steps]);

  // Kalkulasi posisi ujung indikator
  const angle = valueToAngle(value);
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.33;
  const indicatorLen = r * 0.7;
  const ix = cx + Math.sin(angle) * indicatorLen;
  const iy = cy - Math.cos(angle) * indicatorLen;

  // Arc background track
  const trackR = size * 0.38;
  const arcStart = {
    x: cx + Math.sin(START_ANGLE) * trackR,
    y: cy - Math.cos(START_ANGLE) * trackR,
  };
  const arcEnd = {
    x: cx + Math.sin(END_ANGLE) * trackR,
    y: cy - Math.cos(END_ANGLE) * trackR,
  };
  // Arc nilai aktif
  const valueAngle = valueToAngle(value);
  const valueArcEnd = {
    x: cx + Math.sin(valueAngle) * trackR,
    y: cy - Math.cos(valueAngle) * trackR,
  };
  const largeArc = (valueAngle - START_ANGLE) > Math.PI ? 1 : 0;

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startValue: value };
    setIsDragging(true);
  }, [disabled, value]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dy = dragRef.current.startY - e.clientY; // drag atas = naik
      const range = max - min;

      let newValue: number;
      if (steps) {
        const currentIdx = steps.indexOf(snapToSteps(dragRef.current.startValue));
        const stepDelta = Math.round(dy / (sensitivity * 8));
        const newIdx = Math.max(0, Math.min(steps.length - 1, currentIdx + stepDelta));
        newValue = steps[newIdx];
      } else {
        const delta = (dy / (sensitivity * 50)) * range;
        newValue = Math.max(min, Math.min(max, dragRef.current.startValue + delta));
        // Snap ke step
        if (step > 0) newValue = Math.round(newValue / step) * step;
      }

      if (newValue !== value) onChange(newValue);
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
  }, [isDragging, value, min, max, step, steps, sensitivity, onChange, snapToSteps]);

  // Scroll wheel juga bisa putar knob
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    if (steps) {
      const idx = steps.indexOf(snapToSteps(value));
      const newIdx = Math.max(0, Math.min(steps.length - 1, idx + dir));
      onChange(steps[newIdx]);
    } else {
      const newValue = Math.max(min, Math.min(max, value + dir * step));
      onChange(newValue);
    }
  }, [disabled, value, min, max, step, steps, onChange, snapToSteps]);

  const displayValue = formatValue ? formatValue(value) : `${value}${unit ?? ''}`;

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg
        width={size}
        height={size}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        style={{ cursor: disabled ? 'not-allowed' : isDragging ? 'ns-resize' : 'grab' }}
      >
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={size * 0.46}
          fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="1.5" />

        {/* Track background */}
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${trackR} ${trackR} 0 1 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none" stroke="#2a2a2a" strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Track value (filled portion) */}
        {value > min && (
          <path
            d={`M ${arcStart.x} ${arcStart.y} A ${trackR} ${trackR} 0 ${largeArc} 1 ${valueArcEnd.x} ${valueArcEnd.y}`}
            fill="none" stroke={color} strokeWidth="2.5"
            strokeLinecap="round"
            opacity={disabled ? 0.3 : 1}
          />
        )}

        {/* Knob body */}
        <circle cx={cx} cy={cy} r={r}
          fill={isDragging ? '#333' : '#252525'}
          stroke="#444" strokeWidth="1"
        />

        {/* Indicator line */}
        <line
          x1={cx} y1={cy}
          x2={ix} y2={iy}
          stroke={disabled ? '#555' : color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Label */}
      {label && (
        <span style={{ fontSize: 9, color: '#9CA3AF', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {label}
        </span>
      )}

      {/* Value display (muncul saat drag) */}
      {isDragging && (
        <span style={{ fontSize: 9, color: color, fontFamily: 'monospace' }}>
          {displayValue}
        </span>
      )}
    </div>
  );
}