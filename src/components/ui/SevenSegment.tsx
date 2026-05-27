'use client';

import React from 'react';

// Segment mapping per digit 0-9 dan beberapa karakter
// Segment order: [top, topRight, botRight, bot, botLeft, topLeft, mid]
const SEGMENTS: Record<string, boolean[]> = {
  '0': [true,  true,  true,  true,  true,  true,  false],
  '1': [false, true,  true,  false, false, false, false],
  '2': [true,  true,  false, true,  true,  false, true ],
  '3': [true,  true,  true,  true,  false, false, true ],
  '4': [false, true,  true,  false, false, true,  true ],
  '5': [true,  false, true,  true,  false, true,  true ],
  '6': [true,  false, true,  true,  true,  true,  true ],
  '7': [true,  true,  true,  false, false, false, false],
  '8': [true,  true,  true,  true,  true,  true,  true ],
  '9': [true,  true,  true,  true,  false, true,  true ],
  '.': [false, false, false, false, false, false, false], // hanya dot
  '-': [false, false, false, false, false, false, true ],
  ' ': [false, false, false, false, false, false, false],
};

interface DigitProps {
  char: string;
  hasDot?: boolean;
  width?: number;
  height?: number;
  onColor?: string;
  offColor?: string;
}

function Digit({
  char, hasDot = false,
  width = 14, height = 24,
  onColor = '#FF4500', offColor = '#2D0A00',
}: DigitProps) {
  const segs = SEGMENTS[char] ?? SEGMENTS[' '];
  const sw = width * 0.12;   // segment width
  const gap = 1.5;
  const hw = width - gap * 2;
  const hh = (height - gap * 3) / 2;

  // Segment definitions [x, y, w, h, isHorizontal]
  const segDefs = [
    // top
    { x: gap + sw, y: gap, w: hw - sw * 2, h: sw, hz: true,  idx: 0 },
    // topRight
    { x: width - gap - sw, y: gap + sw, w: sw, h: hh - sw * 2, hz: false, idx: 1 },
    // botRight
    { x: width - gap - sw, y: height / 2 + gap / 2, w: sw, h: hh - sw * 2, hz: false, idx: 2 },
    // bottom
    { x: gap + sw, y: height - gap - sw, w: hw - sw * 2, h: sw, hz: true,  idx: 3 },
    // botLeft
    { x: gap, y: height / 2 + gap / 2, w: sw, h: hh - sw * 2, hz: false, idx: 4 },
    // topLeft
    { x: gap, y: gap + sw, w: sw, h: hh - sw * 2, hz: false, idx: 5 },
    // middle
    { x: gap + sw, y: height / 2 - sw / 2, w: hw - sw * 2, h: sw, hz: true, idx: 6 },
  ];

  return (
    <svg width={width + (hasDot ? 4 : 0)} height={height} style={{ display: 'block' }}>
      {segDefs.map(({ x, y, w, h, idx }) => (
        <rect
          key={idx}
          x={x} y={y} width={w} height={h}
          rx={sw / 2}
          fill={segs[idx] ? onColor : offColor}
        />
      ))}
      {hasDot && (
        <circle
          cx={width + 1.5} cy={height - gap - sw / 2}
          r={sw * 0.8}
          fill={onColor}
        />
      )}
    </svg>
  );
}

interface SevenSegmentProps {
  value: number;          // Hz
  digits?: number;        // jumlah digit, default 8
  mode?: 'FREQ' | 'PRID';
  isOverflow?: boolean;
  isOff?: boolean;
  width?: number;
  height?: number;
}

export default function SevenSegment({
  value, digits = 8, mode = 'FREQ',
  isOverflow = false, isOff = false,
  width = 14, height = 24,
}: SevenSegmentProps) {
  const onColor  = isOff ? '#1A0500' : '#FF4500';
  const offColor = '#1A0500';

  // Format angka → string 8 digit
  const formatDisplay = (): { chars: string[]; dots: boolean[]; unit: string; exp: string } => {
    if (isOff) {
      return {
        chars: Array(digits).fill(' '),
        dots: Array(digits).fill(false),
        unit: '',
        exp: '',
      };
    }

    if (value === 0) {
      const chars = Array(digits).fill('0');
      return { chars, dots: Array(digits).fill(false), unit: 'Hz', exp: '' };
    }

    let displayVal = value;
    let unit = 'Hz';
    let exp = '';

    if (value >= 1_000_000) {
      displayVal = value / 1_000_000;
      unit = 'Hz'; exp = 'M';
    } else if (value >= 1_000) {
      displayVal = value / 1_000;
      unit = 'Hz'; exp = 'k';
    }

    // Format ke string dengan presisi cukup untuk 8 digit
    const str = displayVal.toFixed(6).replace('.', '');
    const integerPart = Math.floor(displayVal).toString();
    const dotPos = integerPart.length;  // posisi desimal dari kiri

    // Ambil 8 digit dari string angka
    const rawDigits = displayVal.toFixed(Math.max(0, digits - integerPart.length - 1))
      .replace('.', '')
      .padStart(digits, ' ')
      .slice(-digits);

    const chars  = rawDigits.split('');
    const dots   = Array(digits).fill(false);
    if (dotPos < digits) dots[dotPos - 1] = true;

    return { chars, dots, unit, exp };
  };

  const { chars, dots, unit, exp } = formatDisplay();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: 1,
      backgroundColor: '#0D0500',
      padding: '4px 6px',
      borderRadius: 3,
      border: '1px solid #1A0A00',
      boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.8)',
    }}>
      {/* OVER indicator */}
      <span style={{
        fontSize: 7,
        color: isOverflow ? '#FF4500' : '#2D0A00',
        alignSelf: 'center',
        marginRight: 2,
        fontFamily: 'monospace',
      }}>
        OVR
      </span>

      {/* Digits */}
      {chars.map((char, i) => (
        <Digit
          key={i}
          char={char}
          hasDot={dots[i]}
          width={width}
          height={height}
          onColor={onColor}
          offColor={offColor}
        />
      ))}

      {/* Unit area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        marginLeft: 3,
        gap: 1,
        paddingBottom: 2,
      }}>
        <span style={{ fontSize: 8, color: exp ? onColor : offColor, fontFamily: 'monospace', fontWeight: 'bold' }}>
          {exp || 'G'}
        </span>
        <span style={{ fontSize: 8, color: exp === 'M' ? onColor : offColor, fontFamily: 'monospace', fontWeight: 'bold' }}>
          M
        </span>
        <span style={{ fontSize: 8, color: exp === 'k' ? onColor : offColor, fontFamily: 'monospace', fontWeight: 'bold' }}>
          k
        </span>
        <span style={{ fontSize: 8, color: unit ? onColor : offColor, fontFamily: 'monospace', fontWeight: 'bold' }}>
          Hz
        </span>
      </div>
    </div>
  );
}