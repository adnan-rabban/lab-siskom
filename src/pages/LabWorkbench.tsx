import {
  useEffect, useState, useMemo, useCallback, useRef, useLayoutEffect,
} from 'react';
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
// Canvas Widget Types
// ============================================================
interface WidgetPosition { x: number; y: number }
interface WidgetMeta {
  id: string;
  label: string;
  category: 'module' | 'instrument' | 'panel';
  icon: string;
  defaultPos: WidgetPosition;
  width: number;
}

// ============================================================
// Default Widget Layout
// ============================================================
function buildDefaultLayout(config: PracticumConfig): WidgetMeta[] {
  const layout: WidgetMeta[] = [];
  let mx = 40;

  // Modules row
  for (const mod of config.requiredModules) {
    layout.push({
      id: `module-${mod.nodeId}`,
      label: mod.label,
      category: 'module',
      icon: moduleIcon(mod.moduleType),
      defaultPos: { x: mx, y: 80 },
      width: 220,
    });
    mx += 240;
  }

  // Instruments row
  const instY = 380;
  let ix = 40;
  layout.push({
    id: 'instrument-oscilloscope',
    label: 'Oscilloscope',
    category: 'instrument',
    icon: '📺',
    defaultPos: { x: ix, y: instY },
    width: 680,
  });
  ix += 710;

  for (const inst of config.requiredInstruments) {
    if (inst.moduleType === 'frequency-counter') {
      layout.push({
        id: `instrument-freq-${inst.nodeId}`,
        label: inst.label,
        category: 'instrument',
        icon: '🔢',
        defaultPos: { x: ix, y: instY },
        width: 300,
      });
      ix += 330;
    } else if (inst.moduleType === 'function-generator') {
      layout.push({
        id: `instrument-fgen-${inst.nodeId}`,
        label: inst.label,
        category: 'instrument',
        icon: '〰️',
        defaultPos: { x: ix, y: instY },
        width: 300,
      });
      ix += 330;
    }
  }

  // Panels row
  const panelY = 780;
  layout.push(
    { id: 'panel-connections', label: 'Connection Panel', category: 'panel', icon: '🔌', defaultPos: { x: 40, y: panelY }, width: 520 },
    { id: 'panel-procedure', label: 'Lab Procedure', category: 'panel', icon: '📋', defaultPos: { x: 580, y: panelY }, width: 400 },
    { id: 'panel-measurements', label: 'Measurement Table', category: 'panel', icon: '📊', defaultPos: { x: 40, y: 1160 }, width: 940 },
  );

  return layout;
}

function moduleIcon(type: string) {
  switch (type) {
    case 'power-supply': return '⚡';
    case 'signal-source': return '📡';
    case 'amplifier': return '🔊';
    case 'tuned-circuit': return '🎯';
    case 'waveform-synthesis': return '〰️';
    case 'detector': return '🔍';
    case 'fm-modulator': return '📻';
    default: return '📦';
  }
}

// ============================================================
// Module Renderer
// ============================================================
function renderModule(moduleType: string, nodeId: string) {
  switch (moduleType) {
    case 'power-supply': return <PowerSupply key={nodeId} nodeId={nodeId} />;
    case 'signal-source': return <SignalSource key={nodeId} nodeId={nodeId} />;
    case 'amplifier': return <Amplifier key={nodeId} nodeId={nodeId} />;
    case 'tuned-circuit': return <TunedCircuit key={nodeId} nodeId={nodeId} />;
    case 'waveform-synthesis': return <WaveformSynthesis key={nodeId} nodeId={nodeId} />;
    case 'detector': return <Detector key={nodeId} nodeId={nodeId} />;
    case 'fm-modulator': return <FMModulator key={nodeId} nodeId={nodeId} />;
    default: return null;
  }
}

// ============================================================
// Persistence helpers for canvas layout
// ============================================================
function canvasStorageKey(practicumId: string) {
  return `lab-canvas-layout-${practicumId}`;
}
function saveCanvasLayout(
  practicumId: string,
  positions: Record<string, WidgetPosition>,
  hidden: string[],
  minimized: string[],
) {
  localStorage.setItem(canvasStorageKey(practicumId), JSON.stringify({ positions, hidden, minimized }));
}
function loadCanvasLayout(practicumId: string) {
  try {
    const raw = localStorage.getItem(canvasStorageKey(practicumId));
    if (!raw) return null;
    return JSON.parse(raw) as {
      positions: Record<string, WidgetPosition>;
      hidden: string[];
      minimized: string[];
    };
  } catch { return null; }
}
function clearCanvasLayout(practicumId: string) {
  localStorage.removeItem(canvasStorageKey(practicumId));
}

// ============================================================
// Lab Workbench — Infinite Canvas
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

  // ── Canvas State ──────────────────────────────────────────
  const [pan, setPan] = useState({ x: 80, y: 40 });
  const [zoom, setZoom] = useState(0.85);
  const [widgetPositions, setWidgetPositions] = useState<Record<string, WidgetPosition>>({});
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set());
  const [minimizedWidgets, setMinimizedWidgets] = useState<Set<string>>(new Set());
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [toolbarTab, setToolbarTab] = useState<'tools' | 'view'>('tools');

  const canvasRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ isPanning: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
  const dragRef = useRef<{ widgetId: string; startX: number; startY: number; startWX: number; startWY: number } | null>(null);

  const entry = practicumId ? practicumRegistry[practicumId] : null;
  const config = entry?.config ?? null;
  const measurementRows = entry?.rows ?? [];

  // Build widget metadata from config
  const widgetMetas = useMemo(() => config ? buildDefaultLayout(config) : [], [config]);

  // Initialize signal graph
  useEffect(() => {
    if (!config || !practicumId) return;
    const saved = loadPersistedState(practicumId);

    for (const mod of config.requiredModules) {
      const ports = getPortsForModule(mod.moduleType, mod.nodeId);
      const savedParams = saved?.paramOverrides?.[mod.nodeId];
      const node: SignalNode = {
        id: mod.nodeId, type: mod.moduleType === 'power-supply' ? 'source' : 'processor',
        moduleType: mod.moduleType, label: mod.label,
        params: { ...mod.initialParams, ...savedParams }, ports,
      };
      dispatch({ type: 'ADD_NODE', node });
    }

    for (const inst of config.requiredInstruments) {
      const savedParams = saved?.paramOverrides?.[inst.nodeId];
      const node: SignalNode = {
        id: inst.nodeId, type: 'instrument', moduleType: inst.moduleType, label: inst.label,
        params: inst.moduleType === 'function-generator'
          ? { frequency: 300, amplitude: 1, waveform: 'sine', ...savedParams }
          : { ...savedParams },
        ports: getPortsForModule(inst.moduleType, inst.nodeId),
      };
      dispatch({ type: 'ADD_NODE', node });
    }

    const connections: Connection[] = config.requiredConnections.map(c => {
      const savedConn = saved?.connections?.find(sc => sc.id === c.id);
      return { ...c, connected: savedConn?.connected ?? false };
    });
    dispatch({ type: 'SET_CONNECTIONS', connections });

    if (saved?.powerOn) {
      dispatch({ type: 'SET_POWER', on: true });
      dispatch({ type: 'UPDATE_NODE_PARAMS', nodeId: 'psu', params: { enabled: true } });
    }
    if (saved?.currentStep) setCurrentStep(saved.currentStep);
    if (saved?.measurements) setMeasurementValues(saved.measurements);
    if (saved) addToast(t('Sesi sebelumnya dipulihkan', 'Previous session restored'), 'info');

    // Load canvas layout
    const canvasLayout = loadCanvasLayout(practicumId);
    if (canvasLayout) {
      setWidgetPositions(canvasLayout.positions);
      setHiddenWidgets(new Set(canvasLayout.hidden));
      setMinimizedWidgets(new Set(canvasLayout.minimized));
    }

    setInitialized(true);
    return () => {
      dispatch({ type: 'RESET', state: { nodes: new Map(), connections: [], powerOn: false, language: state.language } });
      setInitialized(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.id]);

  // Auto-save canvas layout
  useEffect(() => {
    if (!practicumId || !initialized) return;
    saveCanvasLayout(
      practicumId,
      widgetPositions,
      [...hiddenWidgets],
      [...minimizedWidgets],
    );
  }, [practicumId, initialized, widgetPositions, hiddenWidgets, minimizedWidgets]);

  useWorkbenchPersistence(
    practicumId || '', state.powerOn, state.connections,
    state.nodes as any, currentStep, measurementValues,
  );

  // ── Widget Helpers ────────────────────────────────────────
  const getWidgetPos = useCallback((id: string, meta: WidgetMeta): WidgetPosition => {
    return widgetPositions[id] ?? meta.defaultPos;
  }, [widgetPositions]);

  const setWidgetPos = useCallback((id: string, pos: WidgetPosition) => {
    setWidgetPositions(prev => ({ ...prev, [id]: pos }));
  }, []);

  const showWidget = useCallback((id: string) => {
    setHiddenWidgets(prev => { const s = new Set(prev); s.delete(id); return s; });
    // Bring it into view if needed
    const meta = widgetMetas.find(m => m.id === id);
    if (meta) {
      const pos = widgetPositions[id] ?? meta.defaultPos;
      setPan({ x: -pos.x * zoom + 100, y: -pos.y * zoom + 100 });
    }
  }, [widgetMetas, widgetPositions, zoom]);

  const hideWidget = useCallback((id: string) => {
    setHiddenWidgets(prev => { const s = new Set(prev); s.add(id); return s; });
  }, []);

  const toggleMinimized = useCallback((id: string) => {
    setMinimizedWidgets(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }, []);

  // ── Canvas Mouse Handlers ─────────────────────────────────
  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.canvas-widget')) return;
    if (e.button !== 0) return;
    panRef.current = { isPanning: true, startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pan]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (panRef.current.isPanning) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setPan({ x: panRef.current.startPanX + dx, y: panRef.current.startPanY + dy });
    }
    if (dragRef.current) {
      const dx = (e.clientX - dragRef.current.startX) / zoom;
      const dy = (e.clientY - dragRef.current.startY) / zoom;
      setWidgetPos(dragRef.current.widgetId, {
        x: Math.max(0, dragRef.current.startWX + dx),
        y: Math.max(0, dragRef.current.startWY + dy),
      });
    }
  }, [zoom, setWidgetPos]);

  const handleCanvasPointerUp = useCallback(() => {
    panRef.current.isPanning = false;
    dragRef.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => {
      const newZoom = Math.min(Math.max(prev * factor, 0.2), 2.5);
      const wx = (cursorX - pan.x) / prev;
      const wy = (cursorY - pan.y) / prev;
      setPan({ x: cursorX - wx * newZoom, y: cursorY - wy * newZoom });
      return newZoom;
    });
  }, [pan]);

  // ── Widget Drag Start ─────────────────────────────────────
  const startWidgetDrag = useCallback((e: React.PointerEvent, id: string, meta: WidgetMeta) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const pos = widgetPositions[id] ?? meta.defaultPos;
    dragRef.current = {
      widgetId: id,
      startX: e.clientX,
      startY: e.clientY,
      startWX: pos.x,
      startWY: pos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [widgetPositions]);

  // ── Fit & Reset ───────────────────────────────────────────
  const handleFitToScreen = useCallback(() => {
    const visibleMetas = widgetMetas.filter(m => !hiddenWidgets.has(m.id));
    if (!visibleMetas.length || !canvasRef.current) return;
    const positions = visibleMetas.map(m => widgetPositions[m.id] ?? m.defaultPos);
    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxX = Math.max(...visibleMetas.map((m, i) => positions[i].x + m.width));
    const maxY = Math.max(...positions.map(p => p.y + 300));
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = (rect.width - 80) / (maxX - minX);
    const scaleY = (rect.height - 80) / (maxY - minY);
    const newZoom = Math.min(scaleX, scaleY, 1.5);
    setZoom(newZoom);
    setPan({
      x: (rect.width / 2) - ((minX + maxX) / 2) * newZoom,
      y: (rect.height / 2) - ((minY + maxY) / 2) * newZoom,
    });
  }, [widgetMetas, hiddenWidgets, widgetPositions]);

  const handleResetLayout = useCallback(() => {
    if (!practicumId) return;
    if (confirm(t('Reset semua pengaturan & layout?', 'Reset all settings & layout?'))) {
      clearPersistedState(practicumId);
      clearCanvasLayout(practicumId);
      window.location.reload();
    }
  }, [practicumId, t]);

  // ── Probe Targets ─────────────────────────────────────────
  const probeTargets = useMemo(() => {
    if (!config) return [];
    return [
      ...config.requiredModules.filter(m => m.moduleType !== 'power-supply').map(m => ({
        nodeId: m.nodeId, portId: 'output',
        label: `${m.label} (${m.moduleType.replace(/-/g, ' ')})`,
      })),
      ...config.requiredInstruments.filter(i => i.moduleType === 'function-generator').map(i => ({
        nodeId: i.nodeId, portId: 'output', label: i.label,
      })),
    ];
  }, [config]);

  // ── Measurement & Grading ─────────────────────────────────
  const handleMeasurementChange = useCallback((rowId: string, fieldId: string, value: string) => {
    setMeasurementValues(prev => ({ ...prev, [rowId]: { ...(prev[rowId] || {}), [fieldId]: value } }));
  }, []);

  const handleSubmitGrading = useCallback(() => {
    if (!config || !practicumId) return;
    const result = evaluateMeasurements(practicumId, measurementRows, config.observationTargets, measurementValues);
    setGradingResult(result);
    addToast(`${t('Skor', 'Score')}: ${result.percentage}%`, result.percentage >= 70 ? 'success' : 'warning');
  }, [config, practicumId, measurementRows, measurementValues, addToast, t]);

  const connectedCount = state.connections.filter(c => c.connected).length;

  const handleConnectAll = useCallback(() => {
    for (const conn of state.connections) if (!conn.connected) dispatch({ type: 'TOGGLE_CONNECTION', connectionId: conn.id });
    addToast(t('Semua kabel terhubung', 'All wires connected'), 'success');
  }, [state.connections, dispatch, addToast, t]);

  const handleDisconnectAll = useCallback(() => {
    for (const conn of state.connections) if (conn.connected) dispatch({ type: 'TOGGLE_CONNECTION', connectionId: conn.id });
    addToast(t('Semua kabel terlepas', 'All wires disconnected'), 'info');
  }, [state.connections, dispatch, addToast, t]);

  // ── Render widget content ─────────────────────────────────
  const renderWidgetContent = useCallback((meta: WidgetMeta) => {
    if (!config) return null;

    if (meta.category === 'module') {
      const nodeId = meta.id.replace('module-', '');
      const mod = config.requiredModules.find(m => m.nodeId === nodeId);
      if (!mod) return null;
      return renderModule(mod.moduleType, mod.nodeId);
    }

    if (meta.id === 'instrument-oscilloscope') {
      return <Oscilloscope probeTargets={probeTargets} />;
    }

    if (meta.id.startsWith('instrument-freq-')) {
      const nodeId = meta.id.replace('instrument-freq-', '');
      return <FrequencyCounter probeTargets={probeTargets.map(p => ({ nodeId: p.nodeId, label: p.label }))} />;
    }

    if (meta.id.startsWith('instrument-fgen-')) {
      const nodeId = meta.id.replace('instrument-fgen-', '');
      return <FunctionGenerator nodeId={nodeId} />;
    }

    if (meta.id === 'panel-connections') {
      return (
        <ConnectionPanel
          connections={state.connections}
          connectedCount={connectedCount}
          totalCount={state.connections.length}
          onConnectAll={handleConnectAll}
          onDisconnectAll={handleDisconnectAll}
        />
      );
    }

    if (meta.id === 'panel-procedure') {
      return (
        <StepGuide
          steps={config.procedure}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          completedSteps={currentStep - 1}
        />
      );
    }

    if (meta.id === 'panel-measurements') {
      return (
        <MeasurementTable
          title={`${config.title} Measurements`}
          titleId={`Pengukuran ${config.titleId}`}
          rows={measurementRows}
          values={measurementValues}
          onValueChange={handleMeasurementChange}
          onSubmitGrading={handleSubmitGrading}
          t={t}
        />
      );
    }

    return null;
  }, [
    config, probeTargets, state.connections, connectedCount,
    handleConnectAll, handleDisconnectAll, currentStep,
    measurementRows, measurementValues, handleMeasurementChange,
    handleSubmitGrading, t,
  ]);

  // ── Early exit if no config ───────────────────────────────
  if (!config) {
    return (
      <div className="workbench-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-secondary)' }}>Practicum not found</h2>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Toolbar widget groups ─────────────────────────────────
  const moduleWidgets = widgetMetas.filter(m => m.category === 'module');
  const instrumentWidgets = widgetMetas.filter(m => m.category === 'instrument');
  const panelWidgets = widgetMetas.filter(m => m.category === 'panel');

  return (
    <div className="workbench-page canvas-workbench-page">
      {/* ── Topbar ── */}
      <header className="workbench-header canvas-header">
        <button className="workbench-back-btn" onClick={() => navigate('/')}>
          ← {t('Kembali', 'Back')}
        </button>
        <div className="workbench-title-section">
          <div className="workbench-title">{t(config.titleId, config.title)}</div>
          <div className="workbench-code">{config.moduleCode}</div>
        </div>
        <div className="workbench-header-actions">
          <div className="canvas-zoom-display">{Math.round(zoom * 100)}%</div>
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
          <button className="btn btn-secondary btn-sm" onClick={handleResetLayout} title="Reset">
            🔄 Reset
          </button>
          <div className="lang-toggle">
            <button className={`lang-option ${state.language === 'id' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_LANGUAGE', language: 'id' })}>ID</button>
            <button className={`lang-option ${state.language === 'en' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_LANGUAGE', language: 'en' })}>EN</button>
          </div>
        </div>
      </header>

      {/* ── Canvas Area ── */}
      <div className="canvas-layout">

        {/* Floating Sidebar Toolbar */}
        <aside className={`canvas-sidebar ${toolbarOpen ? 'open' : 'closed'}`}>
          <button
            className="canvas-sidebar-toggle"
            onClick={() => setToolbarOpen(p => !p)}
            title={toolbarOpen ? 'Collapse' : 'Expand toolbar'}
          >
            {toolbarOpen ? '◀' : '▶'}
          </button>

          {toolbarOpen && (
            <>
              <div className="canvas-sidebar-tabs">
                <button
                  className={`canvas-sidebar-tab ${toolbarTab === 'tools' ? 'active' : ''}`}
                  onClick={() => setToolbarTab('tools')}
                >🧰 Tools</button>
                <button
                  className={`canvas-sidebar-tab ${toolbarTab === 'view' ? 'active' : ''}`}
                  onClick={() => setToolbarTab('view')}
                >🔭 View</button>
              </div>

              {toolbarTab === 'tools' && (
                <div className="canvas-sidebar-body">
                  <div className="canvas-tool-group">
                    <div className="canvas-tool-group-label">📦 {t('Modul', 'Modules')}</div>
                    {moduleWidgets.map(m => (
                      <ToolbarItem
                        key={m.id}
                        meta={m}
                        hidden={hiddenWidgets.has(m.id)}
                        minimized={minimizedWidgets.has(m.id)}
                        onShow={() => showWidget(m.id)}
                        onHide={() => hideWidget(m.id)}
                        onMinToggle={() => toggleMinimized(m.id)}
                        onFocus={() => {
                          const pos = widgetPositions[m.id] ?? m.defaultPos;
                          const rect = canvasRef.current?.getBoundingClientRect();
                          if (rect) setPan({ x: -pos.x * zoom + rect.width / 2, y: -pos.y * zoom + rect.height / 2 });
                        }}
                      />
                    ))}
                  </div>

                  <div className="canvas-tool-group">
                    <div className="canvas-tool-group-label">📡 {t('Instrumen', 'Instruments')}</div>
                    {instrumentWidgets.map(m => (
                      <ToolbarItem
                        key={m.id}
                        meta={m}
                        hidden={hiddenWidgets.has(m.id)}
                        minimized={minimizedWidgets.has(m.id)}
                        onShow={() => showWidget(m.id)}
                        onHide={() => hideWidget(m.id)}
                        onMinToggle={() => toggleMinimized(m.id)}
                        onFocus={() => {
                          const pos = widgetPositions[m.id] ?? m.defaultPos;
                          const rect = canvasRef.current?.getBoundingClientRect();
                          if (rect) setPan({ x: -pos.x * zoom + rect.width / 2, y: -pos.y * zoom + rect.height / 2 });
                        }}
                      />
                    ))}
                  </div>

                  <div className="canvas-tool-group">
                    <div className="canvas-tool-group-label">📋 {t('Panel', 'Panels')}</div>
                    {panelWidgets.map(m => (
                      <ToolbarItem
                        key={m.id}
                        meta={m}
                        hidden={hiddenWidgets.has(m.id)}
                        minimized={minimizedWidgets.has(m.id)}
                        onShow={() => showWidget(m.id)}
                        onHide={() => hideWidget(m.id)}
                        onMinToggle={() => toggleMinimized(m.id)}
                        onFocus={() => {
                          const pos = widgetPositions[m.id] ?? m.defaultPos;
                          const rect = canvasRef.current?.getBoundingClientRect();
                          if (rect) setPan({ x: -pos.x * zoom + rect.width / 2, y: -pos.y * zoom + rect.height / 2 });
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {toolbarTab === 'view' && (
                <div className="canvas-sidebar-body">
                  <div className="canvas-tool-group">
                    <div className="canvas-tool-group-label">🔍 {t('Zoom', 'Zoom')}</div>
                    <div className="canvas-zoom-controls">
                      <button className="canvas-zoom-btn" onClick={() => setZoom(z => Math.min(z * 1.2, 2.5))}>+</button>
                      <span className="canvas-zoom-label">{Math.round(zoom * 100)}%</span>
                      <button className="canvas-zoom-btn" onClick={() => setZoom(z => Math.max(z / 1.2, 0.2))}>−</button>
                    </div>
                    <div className="canvas-view-btns">
                      <button className="canvas-view-btn" onClick={() => { setZoom(1); setPan({ x: 80, y: 40 }); }}>100%</button>
                      <button className="canvas-view-btn" onClick={handleFitToScreen}>
                        {t('Sesuaikan Layar', 'Fit Screen')}
                      </button>
                    </div>
                  </div>
                  <div className="canvas-tool-group">
                    <div className="canvas-tool-group-label">⚙️ {t('Layout', 'Layout')}</div>
                    <div className="canvas-view-btns">
                      <button className="canvas-view-btn danger" onClick={handleResetLayout}>
                        🔄 {t('Reset Layout', 'Reset Layout')}
                      </button>
                    </div>
                  </div>
                  <div className="canvas-tool-group">
                    <div className="canvas-tool-group-label">💡 {t('Tips', 'Tips')}</div>
                    <div className="canvas-tips">
                      <p>🖱️ {t('Drag area kosong untuk pan', 'Drag empty area to pan')}</p>
                      <p>🖱️ {t('Scroll untuk zoom', 'Scroll to zoom')}</p>
                      <p>⠿ {t('Drag header widget untuk pindah', 'Drag widget header to move')}</p>
                      <p>_ {t('Minimize widget dengan tombol −', 'Minimize widget with − button')}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </aside>

        {/* Infinite Canvas Viewport */}
        <div
          className="canvas-viewport"
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerLeave={handleCanvasPointerUp}
          onWheel={handleWheel}
          style={{ cursor: panRef.current.isPanning ? 'grabbing' : 'default' }}
        >
          {/* Grid background */}
          <svg className="canvas-grid" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <pattern id="smallGrid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse"
                x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)}>
                <path d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              </pattern>
              <pattern id="bigGrid" width={100 * zoom} height={100 * zoom} patternUnits="userSpaceOnUse"
                x={pan.x % (100 * zoom)} y={pan.y % (100 * zoom)}>
                <rect width={100 * zoom} height={100 * zoom} fill="url(#smallGrid)" />
                <path d={`M ${100 * zoom} 0 L 0 0 0 ${100 * zoom}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bigGrid)" />
          </svg>

          {/* Canvas Surface */}
          <div
            className="canvas-surface"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            {widgetMetas.map(meta => {
              if (hiddenWidgets.has(meta.id)) return null;
              const pos = getWidgetPos(meta.id, meta);
              const isMin = minimizedWidgets.has(meta.id);

              return (
                <div
                  key={meta.id}
                  className={`canvas-widget ${isMin ? 'minimized' : ''}`}
                  style={{ left: pos.x, top: pos.y, width: meta.width }}
                >
                  {/* Widget Header (drag handle) */}
                  <div
                    className="canvas-widget-header"
                    onPointerDown={e => startWidgetDrag(e, meta.id, meta)}
                  >
                    <div className="canvas-widget-header-left">
                      <span className="canvas-widget-drag-grip">⠿</span>
                      <span className="canvas-widget-icon">{meta.icon}</span>
                      <span className="canvas-widget-title">{meta.label}</span>
                      <span className={`canvas-widget-cat canvas-widget-cat-${meta.category}`}>
                        {meta.category}
                      </span>
                    </div>
                    <div className="canvas-widget-header-actions">
                      <button
                        className="canvas-widget-btn"
                        title={isMin ? 'Restore' : 'Minimize'}
                        onPointerDown={e => e.stopPropagation()}
                        onClick={() => toggleMinimized(meta.id)}
                      >
                        {isMin ? '□' : '−'}
                      </button>
                      <button
                        className="canvas-widget-btn canvas-widget-btn-close"
                        title="Hide"
                        onPointerDown={e => e.stopPropagation()}
                        onClick={() => hideWidget(meta.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Widget Body */}
                  {!isMin && (
                    <div className="canvas-widget-body">
                      {renderWidgetContent(meta)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Canvas hint when empty */}
          {widgetMetas.every(m => hiddenWidgets.has(m.id)) && (
            <div className="canvas-empty-hint">
              <div>🧪</div>
              <p>{t('Semua widget tersembunyi', 'All widgets hidden')}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {t('Gunakan toolbar kiri untuk menampilkan kembali', 'Use the left toolbar to show them')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {gradingResult && (
        <ScoreCard result={gradingResult} onClose={() => setGradingResult(null)} t={t} />
      )}
    </div>
  );
}

// ============================================================
// Toolbar Item Component
// ============================================================
function ToolbarItem({
  meta, hidden, minimized,
  onShow, onHide, onMinToggle, onFocus,
}: {
  meta: WidgetMeta;
  hidden: boolean;
  minimized: boolean;
  onShow: () => void;
  onHide: () => void;
  onMinToggle: () => void;
  onFocus: () => void;
}) {
  return (
    <div className={`canvas-tool-item ${hidden ? 'hidden' : ''}`}>
      <button
        className={`canvas-tool-visibility ${hidden ? 'off' : 'on'}`}
        onClick={hidden ? onShow : onHide}
        title={hidden ? 'Show widget' : 'Hide widget'}
      >
        {hidden ? '👁️‍🗨️' : '👁️'}
      </button>
      <button className="canvas-tool-name" onClick={onFocus} disabled={hidden} title="Focus on widget">
        <span className="canvas-tool-icon">{meta.icon}</span>
        <span>{meta.label}</span>
      </button>
      {!hidden && (
        <button
          className={`canvas-tool-min ${minimized ? 'minimized' : ''}`}
          onClick={onMinToggle}
          title={minimized ? 'Restore' : 'Minimize'}
        >
          {minimized ? '□' : '−'}
        </button>
      )}
    </div>
  );
}

// ============================================================
// Helper: Get ports for a module type
// ============================================================
function getPortsForModule(moduleType: string, nodeId: string) {
  switch (moduleType) {
    case 'power-supply': return [{ id: 'power', label: 'POWER', direction: 'output' as const, nodeId }];
    case 'signal-source': return [
      { id: 'output', label: 'OUT', direction: 'output' as const, nodeId },
      { id: 'mod-in', label: 'MOD IN', direction: 'input' as const, nodeId },
    ];
    case 'amplifier': return [
      { id: 'input', label: 'IN', direction: 'input' as const, nodeId },
      { id: 'output', label: 'OUT', direction: 'output' as const, nodeId },
    ];
    case 'tuned-circuit': return [
      { id: 'input', label: 'IN', direction: 'input' as const, nodeId },
      { id: 'output', label: 'OUT', direction: 'output' as const, nodeId },
    ];
    case 'waveform-synthesis': return [
      { id: 'carrier-in', label: 'CARRIER', direction: 'input' as const, nodeId },
      { id: 'mod-in', label: 'MOD IN', direction: 'input' as const, nodeId },
      { id: 'output', label: 'OUT', direction: 'output' as const, nodeId },
    ];
    case 'detector': return [
      { id: 'input', label: 'IN', direction: 'input' as const, nodeId },
      { id: 'output', label: 'OUT', direction: 'output' as const, nodeId },
    ];
    case 'fm-modulator': return [
      { id: 'carrier-in', label: 'CARRIER', direction: 'input' as const, nodeId },
      { id: 'mod-in', label: 'MOD IN', direction: 'input' as const, nodeId },
      { id: 'output', label: 'OUT', direction: 'output' as const, nodeId },
    ];
    case 'function-generator': return [{ id: 'output', label: 'OUTPUT', direction: 'output' as const, nodeId }];
    case 'oscilloscope': return [
      { id: 'ch1', label: 'CH1', direction: 'input' as const, nodeId },
      { id: 'ch2', label: 'CH2', direction: 'input' as const, nodeId },
    ];
    case 'frequency-counter': return [{ id: 'input', label: 'INPUT', direction: 'input' as const, nodeId }];
    default: return [];
  }
}
