'use client';

import { useEffect, useCallback } from 'react';
import { useWorkbenchStore } from '../store/workbenchStore';

interface KeyboardShortcutsProps {
  onToggleGuide?: () => void;
  showHelp?: boolean;
}

export default function KeyboardShortcuts({
  onToggleGuide,
}: KeyboardShortcutsProps) {
  const {
    updateOsc, osc,
    cancelDragging, removeAllCables,
    resetWorkbench, zoomIn, zoomOut, resetView,
  } = useWorkbenchStore();

  const handler = useCallback((e: KeyboardEvent) => {
    // Skip jika sedang mengetik di input/textarea
    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

    switch (true) {
      // Osiloskop
      case e.code === 'Space' && !e.shiftKey: {
        e.preventDefault();
        updateOsc({ isRunning: !osc.isRunning });
        break;
      }
      case e.code === 'KeyA' && !e.ctrlKey: {
        // Autoset
        updateOsc({ isAutosetting: true });
        break;
      }
      case e.code === 'KeyM': {
        updateOsc({ isMeasureOpen: !osc.isMeasureOpen });
        break;
      }
      case e.code === 'KeyC': {
        updateOsc({ isCursorActive: !osc.isCursorActive });
        break;
      }

      // Zoom
      case (e.code === 'Equal' || e.code === 'NumpadAdd') && (e.ctrlKey || e.metaKey): {
        e.preventDefault();
        zoomIn();
        break;
      }
      case (e.code === 'Minus' || e.code === 'NumpadSubtract') && (e.ctrlKey || e.metaKey): {
        e.preventDefault();
        zoomOut();
        break;
      }
      case e.code === 'Digit0' && (e.ctrlKey || e.metaKey): {
        e.preventDefault();
        resetView();
        break;
      }

      // Kabel
      case e.code === 'Escape': {
        cancelDragging();
        break;
      }
      case e.code === 'KeyD' && e.shiftKey: {
        // Shift+D = disconnect all cables
        if (window.confirm('Cabut semua kabel?')) removeAllCables();
        break;
      }

      // Reset
      case e.code === 'KeyR' && e.shiftKey: {
        if (window.confirm('Reset workbench ke posisi awal?')) resetWorkbench();
        break;
      }

      // Guide panel
      case e.code === 'KeyG': {
        onToggleGuide?.();
        break;
      }

      default: break;
    }
  }, [osc, updateOsc, cancelDragging, removeAllCables,
      resetWorkbench, zoomIn, zoomOut, resetView, onToggleGuide]);

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);

  return null; // Pure behavior component
}

// Shortcut help overlay
export function ShortcutHelpButton() {
  const shortcuts = [
    { key: 'Space',   desc: 'Run / Stop osiloskop' },
    { key: 'A',       desc: 'Autoset osiloskop' },
    { key: 'M',       desc: 'Toggle Measure panel' },
    { key: 'C',       desc: 'Toggle Cursor' },
    { key: 'Ctrl +',  desc: 'Zoom in' },
    { key: 'Ctrl −',  desc: 'Zoom out' },
    { key: 'Ctrl 0',  desc: 'Reset zoom' },
    { key: 'Esc',     desc: 'Batalkan drag kabel' },
    { key: 'G',       desc: 'Toggle panduan' },
    { key: 'Shift R', desc: 'Reset workbench' },
    { key: 'Shift D', desc: 'Cabut semua kabel' },
  ];

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(15,23,42,0.85)',
      border: '1px solid #1E293B',
      borderRadius: 8, padding: '6px 10px',
      backdropFilter: 'blur(8px)',
      zIndex: 40, display: 'flex', gap: 12,
      flexWrap: 'wrap', maxWidth: 600,
      justifyContent: 'center',
    }}>
      {shortcuts.map(({ key, desc }) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <kbd style={{
            fontSize: 10, color: '#94A3B8',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: 3, padding: '1px 5px',
            fontFamily: 'monospace',
          }}>
            {key}
          </kbd>
          <span style={{ fontSize: 10, color: '#475569' }}>{desc}</span>
        </div>
      ))}
    </div>
  );
}