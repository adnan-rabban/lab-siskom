import { useMemo } from 'react';

// Segment map: which segments are ON for each digit
const SEGMENT_MAP: Record<string, boolean[]> = {
  // [a, b, c, d, e, f, g]
  '0': [true, true, true, true, true, true, false],
  '1': [false, true, true, false, false, false, false],
  '2': [true, true, false, true, true, false, true],
  '3': [true, true, true, true, false, false, true],
  '4': [false, true, true, false, false, true, true],
  '5': [true, false, true, true, false, true, true],
  '6': [true, false, true, true, true, true, true],
  '7': [true, true, true, false, false, false, false],
  '8': [true, true, true, true, true, true, true],
  '9': [true, true, true, true, false, true, true],
  '-': [false, false, false, false, false, false, true],
  ' ': [false, false, false, false, false, false, false],
  'E': [true, false, false, true, true, true, true],
  'r': [false, false, false, false, true, false, true],
};

const SEGMENT_IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const;

interface SevenSegmentDigitProps {
  char: string;
  decimalPoint?: boolean;
}

function SevenSegmentDigit({ char, decimalPoint }: SevenSegmentDigitProps) {
  const segments = SEGMENT_MAP[char] ?? SEGMENT_MAP[' '];

  return (
    <div className="seven-segment-digit">
      {SEGMENT_IDS.map((seg, i) => {
        const isHorizontal = seg === 'a' || seg === 'g' || seg === 'd';
        return (
          <div
            key={seg}
            className={`seg seg-${seg} ${isHorizontal ? 'seg-h' : 'seg-v'} ${segments[i] ? 'on' : ''}`}
          />
        );
      })}
      {decimalPoint && <div className="seg seg-dp on" />}
    </div>
  );
}

interface SevenSegmentDisplayProps {
  value: string;
  digits?: number;
  unit?: string;
  variant?: 'red' | 'amber';
}

export default function SevenSegmentDisplay({
  value,
  digits = 6,
  unit,
  variant = 'red',
}: SevenSegmentDisplayProps) {
  const chars = useMemo(() => {
    // Pad value to fill digits
    const parts: { char: string; dp: boolean }[] = [];
    let v = value;

    // Handle decimal point as part of digit display
    for (let i = 0; i < v.length && parts.length < digits; i++) {
      if (v[i] === '.') {
        // Add decimal point to previous digit
        if (parts.length > 0) {
          parts[parts.length - 1].dp = true;
        }
      } else {
        parts.push({ char: v[i], dp: false });
      }
    }

    // Pad with spaces on the left
    while (parts.length < digits) {
      parts.unshift({ char: ' ', dp: false });
    }

    return parts;
  }, [value, digits]);

  return (
    <div className={`seven-segment-display ${variant}`}>
      {chars.map((c, i) => (
        <SevenSegmentDigit key={i} char={c.char} decimalPoint={c.dp} />
      ))}
      {unit && <span className="seven-segment-unit">{unit}</span>}
    </div>
  );
}
