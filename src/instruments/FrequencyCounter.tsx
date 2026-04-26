import { useEffect, useState, useRef } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import { processSignalGraph, estimateFrequency } from '../engine/SignalEngine';
import SevenSegmentDisplay from '../components/SevenSegment';
import Terminal from '../components/Terminal';

interface FrequencyCounterProps {
  /** Node ID to measure frequency from */
  probeTargets?: { nodeId: string; label: string }[];
}

function formatFrequency(hz: number): { display: string; unit: string } {
  if (hz >= 1e6) return { display: (hz / 1e6).toFixed(3), unit: 'MHz' };
  if (hz >= 1e3) return { display: (hz / 1e3).toFixed(2), unit: 'kHz' };
  return { display: hz.toFixed(1), unit: 'Hz' };
}

export default function FrequencyCounter({ probeTargets = [] }: FrequencyCounterProps) {
  const { state, t } = useSignalGraph();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(
    probeTargets.length > 0 ? probeTargets[0].nodeId : null
  );
  const [measuredFreq, setMeasuredFreq] = useState<number>(0);
  const intervalRef = useRef<number>(0);

  useEffect(() => {
    if (!state.powerOn || !selectedTarget) {
      setMeasuredFreq(0);
      return;
    }

    const measure = () => {
      const node = state.nodes.get(selectedTarget);
      if (!node) return;

      const freq = node.params.frequency || 0;
      const signal = processSignalGraph(
        state.nodes,
        state.connections,
        selectedTarget,
        'output',
        1024,
        10
      );

      if (signal) {
        const estimated = estimateFrequency(signal, freq, 10);
        setMeasuredFreq(estimated);
      } else {
        setMeasuredFreq(freq);
      }
    };

    measure();
    intervalRef.current = window.setInterval(measure, 500);

    return () => clearInterval(intervalRef.current);
  }, [state.powerOn, selectedTarget, state.nodes, state.connections]);

  const { display, unit } = formatFrequency(measuredFreq);

  return (
    <div className="instrument-panel frequency-counter">
      <div className="instrument-header">
        <span className="instrument-title">{t('Pencacah Frekuensi', 'Frequency Counter')}</span>
      </div>

      <div className="instrument-body">
        <div className="freq-counter-display">
          <SevenSegmentDisplay
            value={state.powerOn ? display : '      '}
            unit={state.powerOn ? unit : ''}
            variant="red"
            digits={7}
          />
        </div>

        {probeTargets.length > 0 && (
          <div className="probe-selector" style={{ marginTop: 'var(--sp-3)' }}>
            <span className="freq-counter-input-label">{t('Masukan', 'Input')}:</span>
            {probeTargets.map(pt => (
              <span
                key={pt.nodeId}
                className={`probe-option ${selectedTarget === pt.nodeId ? 'selected' : ''}`}
                onClick={() => setSelectedTarget(pt.nodeId)}
              >
                {selectedTarget === pt.nodeId ? '●' : '○'} {pt.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="instrument-controls">
        <Terminal id="freq-counter-input" label="INPUT" direction="input" connected={!!selectedTarget} />
      </div>
    </div>
  );
}
