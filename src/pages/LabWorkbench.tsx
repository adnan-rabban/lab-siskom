import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSignalGraph } from '../engine/SignalGraphContext';
import { evaluateMeasurements, type GradingResult } from '../engine/GradingEngine';
import { amModulationConfig, amMeasurementRows } from '../practicums/amModulation';
import { demodulationConfig, demodMeasurementRows } from '../practicums/demodulation';
import { fmModulationConfig, fmMeasurementRows } from '../practicums/fmModulation';
import type { PracticumConfig, SignalNode, Connection, MeasurementRow } from '../engine/types';
import {
  useWorkbenchPersistence,
  loadPersistedState,
  clearPersistedState,
} from '../hooks/useWorkbenchPersistence';
import { useToast } from '../components/Toast';

// Modules
import PowerSupply from '../modules/PowerSupply';
import SignalSource from '../modules/SignalSource';
import Amplifier from '../modules/Amplifier';
import TunedCircuit from '../modules/TunedCircuit';
import WaveformSynthesis from '../modules/WaveformSynthesis';
import Detector from '../modules/Detector';
import FMModulator from '../modules/FMModulator';

// Instruments
import Oscilloscope from '../instruments/Oscilloscope';
import FrequencyCounter from '../instruments/FrequencyCounter';
import FunctionGenerator from '../instruments/FunctionGenerator';

// Components
import ConnectionPanel from '../components/ConnectionPanel';
import StepGuide from '../components/StepGuide';
import MeasurementTable from '../components/MeasurementTable';
import ScoreCard from '../components/ScoreCard';
import ReportExporter from '../components/ReportExporter';

// ============================================================
// Practicum Registry
// ============================================================
const practicumRegistry: Record<string, { config: PracticumConfig; rows: MeasurementRow[] }> = {
  'am-modulation': { config: amModulationConfig, rows: amMeasurementRows },
  'demodulation': { config: demodulationConfig, rows: demodMeasurementRows },
  'fm-modulation': { config: fmModulationConfig, rows: fmMeasurementRows },
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
    case 'detector':
      return <Detector key={nodeId} nodeId={nodeId} />;
    case 'fm-modulator':
      return <FMModulator key={nodeId} nodeId={nodeId} />;
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
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [measurementValues, setMeasurementValues] = useState<Record<string, Record<string, string>>>({});
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [initialized, setInitialized] = useState(false);

  const entry = practicumId ? practicumRegistry[practicumId] : null;
  const config = entry?.config ?? null;
  const measurementRows = entry?.rows ?? [];

  // Initialize the signal graph when the practicum loads
  useEffect(() => {
    if (!config || !practicumId) return;

    // Check for saved state
    const saved = loadPersistedState(practicumId);

    // Add module nodes
    for (const mod of config.requiredModules) {
      const ports = getPortsForModule(mod.moduleType, mod.nodeId);
      const savedParams = saved?.paramOverrides?.[mod.nodeId];
      const node: SignalNode = {
        id: mod.nodeId,
        type: mod.moduleType === 'power-supply' ? 'source' : 'processor',
        moduleType: mod.moduleType,
        label: mod.label,
        params: { ...mod.initialParams, ...savedParams },
        ports,
      };
      dispatch({ type: 'ADD_NODE', node });
    }

    // Add instrument nodes
    for (const inst of config.requiredInstruments) {
      const savedParams = saved?.paramOverrides?.[inst.nodeId];
      const node: SignalNode = {
        id: inst.nodeId,
        type: 'instrument',
        moduleType: inst.moduleType,
        label: inst.label,
        params: inst.moduleType === 'function-generator'
          ? { frequency: 300, amplitude: 1, waveform: 'sine', ...savedParams }
          : { ...savedParams },
        ports: getPortsForModule(inst.moduleType, inst.nodeId),
      };
      dispatch({ type: 'ADD_NODE', node });
    }

    // Set connections (restore saved connection states)
    const connections: Connection[] = config.requiredConnections.map(c => {
      const savedConn = saved?.connections?.find(sc => sc.id === c.id);
      return {
        ...c,
        connected: savedConn?.connected ?? false,
      };
    });
    dispatch({ type: 'SET_CONNECTIONS', connections });

    // Restore power state
    if (saved?.powerOn) {
      dispatch({ type: 'SET_POWER', on: true });
      dispatch({ type: 'UPDATE_NODE_PARAMS', nodeId: 'psu', params: { enabled: true } });
    }

    // Restore step and measurements
    if (saved?.currentStep) setCurrentStep(saved.currentStep);
    if (saved?.measurements) setMeasurementValues(saved.measurements);

    if (saved) {
      addToast(t('Sesi sebelumnya dipulihkan', 'Previous session restored'), 'info');
    }

    setInitialized(true);

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
      setInitialized(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.id]);

  // Auto-save persistence
  useWorkbenchPersistence(
    practicumId || '',
    state.powerOn,
    state.connections,
    state.nodes as any,
    currentStep,
    measurementValues,
  );

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

  // Handle measurement value changes
  const handleMeasurementChange = useCallback((rowId: string, fieldId: string, value: string) => {
    setMeasurementValues(prev => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [fieldId]: value,
      },
    }));
  }, []);

  // Handle grading submission
  const handleSubmitGrading = useCallback(() => {
    if (!config || !practicumId) return;
    const result = evaluateMeasurements(
      practicumId,
      measurementRows,
      config.observationTargets,
      measurementValues
    );
    setGradingResult(result);
    addToast(
      `${t('Skor', 'Score')}: ${result.percentage}%`,
      result.percentage >= 70 ? 'success' : 'warning'
    );
  }, [config, practicumId, measurementRows, measurementValues, addToast, t]);

  // Handle workbench reset
  const handleReset = useCallback(() => {
    if (!practicumId) return;
    if (confirm(t('Reset semua pengaturan?', 'Reset all settings?'))) {
      clearPersistedState(practicumId);
      window.location.reload();
    }
  }, [practicumId, t]);

  // Connect all / disconnect all
  const handleConnectAll = useCallback(() => {
    for (const conn of state.connections) {
      if (!conn.connected) {
        dispatch({ type: 'TOGGLE_CONNECTION', connectionId: conn.id });
      }
    }
    addToast(t('Semua kabel terhubung', 'All wires connected'), 'success');
  }, [state.connections, dispatch, addToast, t]);

  const handleDisconnectAll = useCallback(() => {
    for (const conn of state.connections) {
      if (conn.connected) {
        dispatch({ type: 'TOGGLE_CONNECTION', connectionId: conn.id });
      }
    }
    addToast(t('Semua kabel terlepas', 'All wires disconnected'), 'info');
  }, [state.connections, dispatch, addToast, t]);

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

  const connectedCount = state.connections.filter(c => c.connected).length;

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
          <div className="autosave-indicator">
            <span className="autosave-dot" />
            <span>{t('Tersimpan', 'Saved')}</span>
          </div>
          <ReportExporter
            practicumTitle={t(config.titleId, config.title)}
            moduleCode={config.moduleCode}
            connections={state.connections}
            measurements={measurementValues}
            t={t}
          />
          <button className="btn btn-secondary btn-sm" onClick={handleReset} title={t('Reset', 'Reset')}>
            🔄 Reset
          </button>
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
          <ConnectionPanel
            connections={state.connections}
            connectedCount={connectedCount}
            totalCount={state.connections.length}
            onConnectAll={handleConnectAll}
            onDisconnectAll={handleDisconnectAll}
          />
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
            completedSteps={currentStep - 1}
          />
        </div>

        {/* Measurements Section */}
        <div className="workbench-measurements-section">
          <h3 className="section-title">
            {t('Tabel Pengukuran', 'Measurement Table')}
          </h3>
          <MeasurementTable
            title={`${config.title} Measurements`}
            titleId={`Pengukuran ${config.titleId}`}
            rows={measurementRows}
            values={measurementValues}
            onValueChange={handleMeasurementChange}
            onSubmitGrading={handleSubmitGrading}
            t={t}
          />
        </div>
      </div>

      {/* Grading Result Modal */}
      {gradingResult && (
        <ScoreCard
          result={gradingResult}
          onClose={() => setGradingResult(null)}
          t={t}
        />
      )}
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
    case 'fm-modulator':
      return [
        { id: 'carrier-in', label: 'CARRIER', direction: 'input' as const, nodeId },
        { id: 'mod-in', label: 'MOD IN', direction: 'input' as const, nodeId },
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
