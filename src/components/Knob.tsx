import { useRef, useCallback, useState, useEffect } from 'react';

interface KnobProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  size?: 'sm' | 'md' | 'lg';
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  /** Rotation range in degrees (default 270) */
  rotationRange?: number;
}

export default function Knob({
  label,
  value,
  min,
  max,
  step = 1,
  size = 'md',
  onChange,
  formatValue,
  rotationRange = 270,
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const normalizedValue = (value - min) / (max - min);
  const rotation = -rotationRange / 2 + normalizedValue * rotationRange;
  const displayValue = formatValue ? formatValue(value) : value.toFixed(step < 1 ? 1 : 0);

  const handleStart = useCallback(
    (clientY: number) => {
      setDragging(true);
      startYRef.current = clientY;
      startValueRef.current = value;
    },
    [value]
  );

  const handleMove = useCallback(
    (clientY: number) => {
      if (!dragging) return;
      const delta = startYRef.current - clientY;
      const sensitivity = 200;
      const range = max - min;
      let newValue = startValueRef.current + (delta / sensitivity) * range;

      // Snap to step
      newValue = Math.round(newValue / step) * step;
      newValue = Math.max(min, Math.min(max, newValue));

      if (newValue !== value) {
        onChange(newValue);
      }
    },
    [dragging, min, max, step, value, onChange]
  );

  const handleEnd = useCallback(() => {
    setDragging(false);
  }, []);

  // Mouse events
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientY);
    },
    [handleStart]
  );

  // Touch events (iPad/tablet support)
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleStart(e.touches[0].clientY);
    },
    [handleStart]
  );

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientY);
    };
    const onUp = () => handleEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchcancel', onUp);
    };
  }, [dragging, handleMove, handleEnd]);

  // Scale marks
  const numMarks = 11;
  const marks = Array.from({ length: numMarks }, (_, i) => {
    const angle = -rotationRange / 2 + (i / (numMarks - 1)) * rotationRange;
    return angle;
  });

  return (
    <div className="knob-container">
      {label && <span className="knob-label">{label}</span>}
      <div className="knob-scale">
        {marks.map((angle, i) => (
          <div
            key={i}
            className="knob-scale-mark"
            style={{ transform: `rotate(${angle}deg)` }}
          />
        ))}
      </div>
      <div
        ref={knobRef}
        className={`knob-body knob-${size} ${dragging ? 'dragging' : ''}`}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        role="slider"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label}
        tabIndex={0}
      >
        <div
          className="knob-indicator"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>
      <span className="knob-value">{displayValue}</span>
    </div>
  );
}
