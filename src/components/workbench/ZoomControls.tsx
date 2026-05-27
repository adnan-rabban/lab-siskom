'use client';

import { useWorkbenchStore } from '../../store/workbenchStore';

export default function ZoomControls() {
  const { zoom, zoomIn, zoomOut, resetView } = useWorkbenchStore();

  const pct = Math.round(zoom * 100);

  const btnStyle = (disabled = false): React.CSSProperties => ({
    width: 28,
    height: 28,
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: 5,
    color: disabled ? '#475569' : '#94A3B8',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.1s, color 0.1s',
    userSelect: 'none',
  });

  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      right: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(15,23,42,0.85)',
      border: '1px solid #1E293B',
      borderRadius: 8,
      padding: '4px 6px',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      zIndex: 50,
      userSelect: 'none',
    }}>
      {/* Zoom out */}
      <button
        style={btnStyle(zoom <= 0.3)}
        onClick={zoomOut}
        disabled={zoom <= 0.3}
        title="Zoom out (scroll down)"
      >
        −
      </button>

      {/* Level display — klik untuk reset */}
      <button
        onClick={resetView}
        title="Reset view"
        style={{
          minWidth: 44,
          height: 28,
          backgroundColor: '#1E293B',
          border: '1px solid #334155',
          borderRadius: 5,
          color: '#94A3B8',
          fontSize: 11,
          fontFamily: 'monospace',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 6px',
        }}
      >
        {pct}%
      </button>

      {/* Zoom in */}
      <button
        style={btnStyle(zoom >= 2.0)}
        onClick={zoomIn}
        disabled={zoom >= 2.0}
        title="Zoom in (scroll up)"
      >
        +
      </button>

      {/* Separator */}
      <div style={{ width: 1, height: 16, backgroundColor: '#334155', margin: '0 2px' }} />

      {/* Reset layout */}
      <button
        onClick={resetView}
        title="Reset pan & zoom"
        style={{
          ...btnStyle(),
          fontSize: 11,
          width: 'auto',
          padding: '0 6px',
        }}
      >
        ⌂
      </button>
    </div>
  );
}