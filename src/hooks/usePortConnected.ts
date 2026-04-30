import { useMemo } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';

/**
 * Returns a lookup function that checks if a specific port on a node
 * has at least one active (connected) wire attached to it.
 *
 * Usage:
 *   const isConnected = usePortConnected(nodeId);
 *   <Terminal connected={isConnected('output')} ... />
 */
export function usePortConnected(nodeId: string): (portId: string) => boolean {
  const { state } = useSignalGraph();

  const connectedPorts = useMemo(() => {
    const ports = new Set<string>();

    for (const conn of state.connections) {
      if (!conn.connected) continue;

      if (conn.fromNodeId === nodeId) {
        ports.add(conn.fromPortId);
      }
      if (conn.toNodeId === nodeId) {
        ports.add(conn.toPortId);
      }
    }

    return ports;
  }, [state.connections, nodeId]);

  return (portId: string) => connectedPorts.has(portId);
}
