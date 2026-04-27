import { useEffect, useRef, useCallback } from 'react';
import type { Connection, SignalParams } from '../engine/types';

// ============================================================
// Persistence — save/restore workbench state from localStorage
// ============================================================

interface PersistedState {
  powerOn: boolean;
  connections: { id: string; connected: boolean }[];
  paramOverrides: Record<string, Partial<SignalParams>>;
  currentStep: number;
  measurements: Record<string, Record<string, string>>;
  savedAt: number;
}

const STORAGE_PREFIX = 'lab-workbench-';

function getKey(practicumId: string) {
  return `${STORAGE_PREFIX}${practicumId}`;
}

export function loadPersistedState(practicumId: string): PersistedState | null {
  try {
    const raw = localStorage.getItem(getKey(practicumId));
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedState;
    // Expire after 24 hours
    if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(getKey(practicumId));
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearPersistedState(practicumId: string) {
  localStorage.removeItem(getKey(practicumId));
}

export function useWorkbenchPersistence(
  practicumId: string,
  powerOn: boolean,
  connections: Connection[],
  nodeParams: Map<string, { params: SignalParams }>,
  currentStep: number,
  measurementValues: Record<string, Record<string, string>>
) {
  const timerRef = useRef<number>(0);

  const save = useCallback(() => {
    const state: PersistedState = {
      powerOn,
      connections: connections.map(c => ({ id: c.id, connected: c.connected })),
      paramOverrides: {} as Record<string, Partial<SignalParams>>,
      currentStep,
      measurements: measurementValues,
      savedAt: Date.now(),
    };

    // Save node param overrides
    nodeParams.forEach((node, nodeId) => {
      state.paramOverrides[nodeId] = { ...node.params };
    });

    try {
      localStorage.setItem(getKey(practicumId), JSON.stringify(state));
    } catch {
      // Storage full or unavailable — silently fail
    }
  }, [practicumId, powerOn, connections, nodeParams, currentStep, measurementValues]);

  // Debounced auto-save on every state change
  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(save, 800);
    return () => clearTimeout(timerRef.current);
  }, [save]);
}
