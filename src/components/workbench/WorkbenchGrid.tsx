'use client';

interface WorkbenchGridProps {
  panX: number;
  panY: number;
  zoom: number;
  width?: number | string;
  height?: number | string;
}

const BASE_GRID  = 24;   // jarak antar dot saat zoom=1
const DOT_RADIUS = 1;    // radius dot

export default function WorkbenchGrid({
  panX, panY, zoom,
  width = '100%', height = '100%',
}: WorkbenchGridProps) {
  const gridSize = BASE_GRID * zoom;

  // Offset pattern agar grid mengikuti pan
  const offsetX = ((panX % gridSize) + gridSize) % gridSize;
  const offsetY = ((panY % gridSize) + gridSize) % gridSize;

  const dotColor = zoom < 0.5 ? 'rgba(100,116,139,0.2)' : 'rgba(100,116,139,0.35)';

  // Grid major (setiap 5 dot) lebih terang
  const majorGridSize = gridSize * 5;
  const majorOffsetX  = ((panX % majorGridSize) + majorGridSize) % majorGridSize;
  const majorOffsetY  = ((panY % majorGridSize) + majorGridSize) % majorGridSize;

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width, height,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <defs>
        {/* Minor grid pattern */}
        <pattern
          id="minor-grid"
          x={offsetX}
          y={offsetY}
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={DOT_RADIUS}
            cy={DOT_RADIUS}
            r={Math.max(0.5, DOT_RADIUS * zoom * 0.6)}
            fill={dotColor}
          />
        </pattern>

        {/* Major grid pattern (setiap 5 minor) */}
        <pattern
          id="major-grid"
          x={majorOffsetX}
          y={majorOffsetY}
          width={majorGridSize}
          height={majorGridSize}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={1}
            cy={1}
            r={Math.max(1, DOT_RADIUS * zoom * 0.9)}
            fill="rgba(100,116,139,0.55)"
          />
        </pattern>
      </defs>

      {/* Background */}
      <rect width="100%" height="100%" fill="#0F172A" />

      {/* Minor dots */}
      {zoom > 0.3 && (
        <rect width="100%" height="100%" fill="url(#minor-grid)" />
      )}

      {/* Major dots */}
      <rect width="100%" height="100%" fill="url(#major-grid)" />
    </svg>
  );
}