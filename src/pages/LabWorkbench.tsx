import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSignalGraph } from '../engine/SignalGraphContext';
import { amModulationConfig, amMeasurementRows } from '../practicums/amModulation';
import type { PracticumConfig, SignalNode, Connection } from '../engine/types';

// Modules
import PowerSupply from '../modules/PowerSupply';
import SignalSource from '../modules/SignalSource';
import Amplifier from '../modules/Amplifier';
import TunedCircuit from '../modules/TunedCircuit';
import WaveformSynthesis from '../modules/WaveformSynthesis';

// Instruments
import Oscilloscope from '../instruments/Oscilloscope';
import FrequencyCounter from '../instruments/FrequencyCounter';
import FunctionGenerator from '../instruments/FunctionGenerator';

// Components
import ConnectionPanel from '../components/ConnectionPanel';
import StepGuide from '../components/StepGuide';
import MeasurementTable from '../components/MeasurementTable';

// ============================================================
// Practicum Registry
// ============================================================
const practicumRegistry: Record<string, PracticumConfig> = {
  'am-modulation': amModulationConfig,
};

// ============================================================
// Module Renderer
// ============================================================
function renderModule(moduleType: string, nodeId: string) {
  switch (moduleType) {
    case 'power-supply':
      return <PowerSupply key={nodeId} nodeId={nodeId} />;
    case 'signal-source':
      return <SignalSource key={nodeId} nodeId={nodeId} />;
    case 'amplifier':
      return <Amplifier key={nodeId} nodeId={nodeId} />;
    case 'tuned-circuit':
      return <TunedCircuit key={nodeId} nodeId={nodeId} />;
    case 'waveform-synthesis':
      return <WaveformSynthesis key={nodeId} nodeId={nodeId} />;
    default:
      return null;
  }
}

// ============================================================
// Lab Workbench Page
// ============================================================
export default function LabWorkbench() {
  const { practicumId } = useParams<{ practicumId: string }>();
  const navigate = useNavigate();
  const { state, dispatch, t } = useSignalGraph();
  const [currentStep, setCurrentStep] = useState(1);

  const config = practicumId ? practicumRegistry[practicumId] : null;

  // Initialize the signal graph when the practicum loads
  useEffect(() => {
    if (!config) return;

    // Add module nodes
    for (const mod of config.requiredModules) {
      const ports = getPortsForModule(mod.moduleType, mod.nodeId);
      const node: SignalNode = {
        id: mod.nodeId,
        type: mod.moduleType === 'power-supply' ? 'source' : 'processor',
        moduleType: mod.moduleType,
        label: mod.label,
        params: { ...mod.initialParams },
        ports,
      };
      dispatch({ type: 'ADD_NODE', node });
    }

    // Add instrument nodes
    for (const inst of config.requiredInstruments) {
      const node: SignalNode = {
        id: inst.nodeId,
        type: 'instrument',
        moduleType: inst.moduleType,
        label: inst.label,
        params: inst.moduleType === 'function-generator'
          ? { frequency: 300, amplitude: 1, waveform: 'sine' }
          : {},
        ports: getPortsForModule(inst.moduleType, inst.nodeId),
      };
      dispatch({ type: 'ADD_NODE', node });
    }

    // Set connections
    const connections: Connection[] = config.requiredConnections.map(c => ({
      ...c,
      connected: false,
    }));
    dispatch({ type: 'SET_CONNECTIONS', connections });

    // Cleanup
    return () => {
      dispatch({
        type: 'RESET',
        state: {
          nodes: new Map(),
          connections: [],
          powerOn: false,
          language: state.language,
        },
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.id]);

  // Probe targets for oscilloscope and frequency counter
  const probeTargets = useMemo(() => {
    if (!config) return [];
    return [
      ...config.requiredModules
        .filter(m => m.moduleType !== 'power-supply')
        .map(m => ({
          nodeId: m.nodeId,
          portId: 'output',
          label: `${m.label} (${m.moduleType.replace(/-/g, ' ')})`,
        })),
      ...config.requiredInstruments
        .filter(i => i.moduleType === 'function-generator')
        .map(i => ({
          nodeId: i.nodeId,
          portId: 'output',
          label: i.label,
        })),
    ];
  }, [config]);

  if (!config) {
    return (
      <div className="workbench-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-secondary)' }}>Practicum not found</h2>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '16px' }}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workbench-page">
      {/* Header */}
      <header className="workbench-header">
        <button className="workbench-back-btn" onClick={() => navigate('/')}>
          ← {t('Kembali', 'Back')}
        </button>
        <div className="workbench-title-section">
          <div className="workbench-title">
            {t(config.titleId, config.title)}
          </div>
          <div className="workbench-code">{config.moduleCode}</div>
        </div>
        <div className="workbench-header-actions">
          <div className="lang-toggle">
            <button
              className={`lang-option ${state.language === 'id' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_LANGUAGE', language: 'id' })}
            >
              ID
            </button>
            <button
              className={`lang-option ${state.language === 'en' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_LANGUAGE', language: 'en' })}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="workbench-body">
        {/* Modules Section */}
        <div className="workbench-modules-section">
          <h3 className="section-title">
            {t('Modul Peralatan', 'Hardware Modules')}
          </h3>
          <div className="modules-rack">
            {config.requiredModules.map(mod =>
              renderModule(mod.moduleType, mod.nodeId)
            )}
          </div>
        </div>

        {/* Instruments Section */}
        <div className="workbench-instruments-section">
          <h3 className="section-title">
            {t('Instrumen Pengukuran', 'Measurement Instruments')}
          </h3>

          <Oscilloscope probeTargets={probeTargets} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
            <FrequencyCounter probeTargets={probeTargets.map(p => ({ nodeId: p.nodeId, label: p.label }))} />
            {config.requiredInstruments
              .filter(i => i.moduleType === 'function-generator')
              .map(i => (
                <FunctionGenerator key={i.nodeId} nodeId={i.nodeId} />
              ))}
          </div>
        </div>

        {/* Connections Section */}
        <div className="workbench-connections-section">
          <h3 className="section-title">
            {t('Panel Koneksi', 'Connection Panel')}
          </h3>
          <ConnectionPanel connections={state.connections} />
        </div>

        {/* Procedure Section */}
        <div className="workbench-procedure-section">
          <h3 className="section-title">
            {t('Prosedur Praktikum', 'Lab Procedure')}
          </h3>
          <StepGuide
            steps={config.procedure}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />
        </div>

        {/* Measurements Section */}
        <div className="workbench-measurements-section">
          <h3 className="section-title">
            {t('Tabel Pengukuran', 'Measurement Table')}
          </h3>
          <MeasurementTable
            title="AM Modulation Index Measurements"
            titleId="Pengukuran Indeks Modulasi AM"
            rows={amMeasurementRows}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Helper: Get ports for a module type
// ============================================================
function getPortsForModule(moduleType: string, nodeId: string) {
  switch (moduleType) {
    case 'power-supply':
      return [
        { id: 'power', label: 'POWER', direction: 'output' as const, nodeId },
      ];
    case 'signal-source':
      return [
        { id: 'output', label: 'OUT', direction: 'output' as const, nodeId },
        { id: 'mod-in', label: 'MOD IN', direction: 'input' as const, nodeId },
      ];
    case 'amplifier':
      return [
        { id: 'input', label: 'IN', direction: 'input' as const, nodeId },
        { id: 'output', label: 'OUT', direction: 'output' as const, nodeId },
      ];
    case 'tuned-circuit':
      return [
        { id: 'input', label: 'IN', direction: 'input' as const, nodeId },
        { id: 'output', label: 'OUT', direction: 'output' as const, nodeId },
      ];
    case 'waveform-synthesis':
      return [
        { id: 'carrier-in', label: 'CARRIER', direction: 'input' as const, nodeId },
        { id: 'mod-in', label: 'MOD IN', direction: 'input' as const, nodeId },
        { id: 'output', label: 'OUT', direction: 'output' as const, nodeId },
      ];
    case 'detector':
      return [
        { id: 'input', label: 'IN', direction: 'input' as const, nodeId },
        { id: 'output', label: 'OUT', direction: 'output' as const, nodeId },
      ];
    case 'function-generator':
      return [
        { id: 'output', label: 'OUTPUT', direction: 'output' as const, nodeId },
      ];
    case 'oscilloscope':
      return [
        { id: 'ch1', label: 'CH1', direction: 'input' as const, nodeId },
        { id: 'ch2', label: 'CH2', direction: 'input' as const, nodeId },
      ];
    case 'frequency-counter':
      return [
        { id: 'input', label: 'INPUT', direction: 'input' as const, nodeId },
      ];
    default:
      return [];
  }
}
