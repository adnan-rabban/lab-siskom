// ============================================================
// SignalGraphContext — Structural context (rarely changes)
// ============================================================
// This context manages the signal graph topology (nodes + connections).
// Signal VALUES are NOT stored in React state — they live in refs
// and are updated imperatively each frame.
// ============================================================

import React, { createContext, useContext, useReducer, useRef, useCallback, type ReactNode } from 'react';
import type { SignalNode, Connection, ConnectionValidation, SignalParams, Language } from './types';

// ============================================================
// State Shape
// ============================================================

interface SignalGraphState {
  nodes: Map<string, SignalNode>;
  connections: Connection[];
  powerOn: boolean;
  language: Language;
}

// ============================================================
// Actions
// ============================================================

type SignalGraphAction =
  | { type: 'ADD_NODE'; node: SignalNode }
  | { type: 'REMOVE_NODE'; nodeId: string }
  | { type: 'UPDATE_NODE_PARAMS'; nodeId: string; params: Partial<SignalParams> }
  | { type: 'SET_CONNECTIONS'; connections: Connection[] }
  | { type: 'TOGGLE_CONNECTION'; connectionId: string }
  | { type: 'SET_POWER'; on: boolean }
  | { type: 'SET_LANGUAGE'; language: Language }
  | { type: 'RESET'; state: SignalGraphState };

function signalGraphReducer(state: SignalGraphState, action: SignalGraphAction): SignalGraphState {
  switch (action.type) {
    case 'ADD_NODE': {
      const newNodes = new Map(state.nodes);
      newNodes.set(action.node.id, action.node);
      return { ...state, nodes: newNodes };
    }
    case 'REMOVE_NODE': {
      const newNodes = new Map(state.nodes);
      newNodes.delete(action.nodeId);
      const newConns = state.connections.filter(
        c => c.fromNodeId !== action.nodeId && c.toNodeId !== action.nodeId
      );
      return { ...state, nodes: newNodes, connections: newConns };
    }
    case 'UPDATE_NODE_PARAMS': {
      const newNodes = new Map(state.nodes);
      const node = newNodes.get(action.nodeId);
      if (node) {
        newNodes.set(action.nodeId, {
          ...node,
          params: { ...node.params, ...action.params },
        });
      }
      return { ...state, nodes: newNodes };
    }
    case 'SET_CONNECTIONS': {
      return { ...state, connections: action.connections };
    }
    case 'TOGGLE_CONNECTION': {
      const newConns = state.connections.map(c =>
        c.id === action.connectionId ? { ...c, connected: !c.connected } : c
      );
      return { ...state, connections: newConns };
    }
    case 'SET_POWER': {
      return { ...state, powerOn: action.on };
    }
    case 'SET_LANGUAGE': {
      return { ...state, language: action.language };
    }
    case 'RESET': {
      return action.state;
    }
    default:
      return state;
  }
}

// ============================================================
// Context Types
// ============================================================

interface SignalGraphContextType {
  state: SignalGraphState;
  dispatch: React.Dispatch<SignalGraphAction>;
  /** Ref holding pre-computed signal data — updated imperatively, NOT React state */
  signalValuesRef: React.MutableRefObject<Map<string, Float32Array>>;
  /** Validate a potential connection */
  validateConnection: (fromPortId: string, toPortId: string) => ConnectionValidation;
  /** Get a translated string */
  t: (id: string, en: string) => string;
}

const defaultState: SignalGraphState = {
  nodes: new Map(),
  connections: [],
  powerOn: false,
  language: 'id',
};

const SignalGraphContext = createContext<SignalGraphContextType | null>(null);

// ============================================================
// Provider
// ============================================================

interface SignalGraphProviderProps {
  children: ReactNode;
  initialState?: Partial<SignalGraphState>;
}

export function SignalGraphProvider({ children, initialState }: SignalGraphProviderProps) {
  const [state, dispatch] = useReducer(signalGraphReducer, {
    ...defaultState,
    ...initialState,
    nodes: initialState?.nodes ?? new Map(),
    connections: initialState?.connections ?? [],
  });

  // Signal values ref — updated every animation frame, NOT React state
  const signalValuesRef = useRef<Map<string, Float32Array>>(new Map());

  const validateConnection = useCallback(
    (fromPortId: string, toPortId: string): ConnectionValidation => {
      // Find ports
      let fromPort = null;
      let toPort = null;
      for (const node of state.nodes.values()) {
        for (const port of node.ports) {
          if (port.id === fromPortId) fromPort = port;
          if (port.id === toPortId) toPort = port;
        }
      }

      if (!fromPort || !toPort) {
        return { valid: false, reason: 'Port not found' };
      }

      // Can't connect output to output
      if (fromPort.direction === 'output' && toPort.direction === 'output') {
        return { valid: false, reason: 'Cannot connect two outputs together' };
      }

      // Can't connect input to input
      if (fromPort.direction === 'input' && toPort.direction === 'input') {
        return { valid: false, reason: 'Cannot connect two inputs together' };
      }

      // Can't connect to same node
      if (fromPort.nodeId === toPort.nodeId) {
        return { valid: false, reason: 'Cannot connect a module to itself' };
      }

      return { valid: true };
    },
    [state.nodes]
  );

  const t = useCallback(
    (id: string, en: string): string => {
      return state.language === 'id' ? id : en;
    },
    [state.language]
  );

  return (
    <SignalGraphContext.Provider
      value={{ state, dispatch, signalValuesRef, validateConnection, t }}
    >
      {children}
    </SignalGraphContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useSignalGraph(): SignalGraphContextType {
  const ctx = useContext(SignalGraphContext);
  if (!ctx) {
    throw new Error('useSignalGraph must be used within a SignalGraphProvider');
  }
  return ctx;
}
