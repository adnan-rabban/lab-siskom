import { useRef, useCallback, useEffect } from 'react';
import { useWorkbenchStore } from '../store/workbenchStore';

interface UseZoomOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  minZoom?: number;
  maxZoom?: number;
  zoomSensitivity?: number;
}

export function useZoom({
  containerRef,
  minZoom = 0.3,
  maxZoom = 2.0,
  zoomSensitivity = 1.12,
}: UseZoomOptions) {
  const { zoom, panX, panY, setZoom, setPan } = useWorkbenchStore();

  // Wheel → zoom ke arah kursor
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const factor   = e.deltaY < 0 ? zoomSensitivity : 1 / zoomSensitivity;
    const newZoom  = Math.max(minZoom, Math.min(maxZoom, zoom * factor));
    const mouseX   = e.clientX - rect.left;
    const mouseY   = e.clientY - rect.top;
    const worldX   = (mouseX - panX) / zoom;
    const worldY   = (mouseY - panY) / zoom;

    setZoom(newZoom);
    setPan(mouseX - worldX * newZoom, mouseY - worldY * newZoom);
  }, [zoom, panX, panY, setZoom, setPan, containerRef, minZoom, maxZoom, zoomSensitivity]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel, containerRef]);

  // Screen → canvas coordinate conversion
  const toCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: screenX, y: screenY };
    return {
      x: (screenX - rect.left - panX) / zoom,
      y: (screenY - rect.top  - panY) / zoom,
    };
  }, [panX, panY, zoom, containerRef]);

  const toScreen = useCallback((canvasX: number, canvasY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: canvasX, y: canvasY };
    return {
      x: canvasX * zoom + panX + rect.left,
      y: canvasY * zoom + panY + rect.top,
    };
  }, [panX, panY, zoom, containerRef]);

  return { zoom, panX, panY, toCanvas, toScreen };
}

// Pan logic
export function usePan() {
  const { panX, panY, setPan } = useWorkbenchStore();
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  const startPan = useCallback((e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY };
  }, [panX, panY]);

  const updatePan = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    setPan(
      dragRef.current.startPanX + e.clientX - dragRef.current.startX,
      dragRef.current.startPanY + e.clientY - dragRef.current.startY,
    );
  }, [setPan]);

  const stopPan = useCallback(() => { dragRef.current = null; }, []);

  return { startPan, updatePan, stopPan };
}