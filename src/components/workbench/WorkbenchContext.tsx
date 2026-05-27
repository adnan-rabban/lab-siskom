'use client';

import { createContext, useContext, useRef, RefObject } from 'react';
import { CanvasTransform, Vec2, screenToCanvas } from '../../lib/workbench/workbench.types';

interface WorkbenchContextValue {
  transform: CanvasTransform;
  canvasRef: RefObject<HTMLDivElement | null>;
  toCanvas: (screenX: number, screenY: number) => Vec2;
  toScreen: (canvasX: number, canvasY: number) => Vec2;
}

const DEFAULT_TRANSFORM: CanvasTransform = { panX: 0, panY: 0, zoom: 1 };

export const WorkbenchContext = createContext<WorkbenchContextValue>({
  transform: DEFAULT_TRANSFORM,
  canvasRef: { current: null },
  toCanvas: (x, y) => ({ x, y }),
  toScreen: (x, y) => ({ x, y }),
});

export function useWorkbench() {
  return useContext(WorkbenchContext);
}

// Hook untuk konversi koordinat
export function useCanvasCoords() {
  const { toCanvas, toScreen, transform } = useWorkbench();
  return { toCanvas, toScreen, transform };
}