import type { Connection } from '../engine/types';
import { useSignalGraph } from '../engine/SignalGraphContext';
import ToggleSwitch from './ToggleSwitch';
import { Check, Circle, Zap, X } from 'lucide-react';

interface ConnectionPanelProps {
  connections: Connection[];
  connectedCount?: number;
  totalCount?: number;
  onConnectAll?: () => void;
  onDisconnectAll?: () => void;
}

export default function ConnectionPanel({
  connections,
  connectedCount,
  totalCount,
  onConnectAll,
  onDisconnectAll,
}: ConnectionPanelProps) {
  const { state, dispatch, t } = useSignalGraph();

  const connected = connectedCount ?? connections.filter(c => c.connected).length;
  const total = totalCount ?? connections.length;

  const getPortLabel = (nodeId: string, portId: string): string => {
    const node = state.nodes.get(nodeId);
    if (!node) return portId;
    const port = node.ports.find(p => p.id === portId);
    return port ? `${node.label}.${port.label}` : `${node.label}.${portId}`;
  };

  return (
    <div className="connection-panel">
      <div className="connection-panel-header">
        <span className="connection-panel-title">
          {t('Koneksi Kabel', 'Wire Connections')}
        </span>
        <span className="text-xs text-muted">
          {connected}/{total} {t('terhubung', 'connected')}
        </span>
      </div>
      <div>
        {connections.map((conn) => {
          const fromLabel = getPortLabel(conn.fromNodeId, conn.fromPortId);
          const toLabel = getPortLabel(conn.toNodeId, conn.toPortId);
          const statusClass = conn.connected ? 'connected' : 'disconnected';

          return (
            <div key={conn.id} className="connection-row">
              <span className="connection-from">{fromLabel}</span>
              <div className="connection-wire">
                <span className={`connection-dot ${statusClass}`} />
                <span className={`connection-line ${statusClass}`} />
                <span className={`connection-dot ${statusClass}`} />
              </div>
              <span className="connection-to">{toLabel}</span>
              <ToggleSwitch
                active={conn.connected}
                onChange={() => dispatch({ type: 'TOGGLE_CONNECTION', connectionId: conn.id })}
              />
              <span className={`connection-status ${statusClass}`}>
                {conn.connected ? <Check size={11} /> : <Circle size={11} />}
              </span>
            </div>
          );
        })}
      </div>
      {(onConnectAll || onDisconnectAll) && (
        <div className="connection-panel-actions">
          {onConnectAll && (
            <button className="btn btn-secondary btn-sm" onClick={onConnectAll}>
              <Zap size={11} /> {t('Hubungkan Semua', 'Connect All')}
            </button>
          )}
          {onDisconnectAll && (
            <button className="btn btn-secondary btn-sm" onClick={onDisconnectAll}>
              <X size={11} /> {t('Lepas Semua', 'Disconnect All')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
