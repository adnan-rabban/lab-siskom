import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignalGraphProvider } from './engine/SignalGraphContext';
import { ToastProvider } from './components/Toast';

// ── Lazy-loaded pages (code splitting) ────────────────────────
const Landing = lazy(() => import('./pages/Landing'));
const LabWorkbench = lazy(() => import('./pages/LabWorkbench'));

// Styles
import './index.css';
import './components/components.css';
import './modules/modules.css';
import './instruments/instruments.css';
import './pages/pages.css';
import './pages/canvas.css'; // ← Infinite canvas styles

// ── Minimal loading fallback ──────────────────────────────────
function LoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0C0C0C',
        color: 'rgba(240, 239, 232, 0.35)',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '0.75rem',
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        gap: '8px',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#FF5C00',
          animation: 'pulse-glow 1.2s infinite',
        }}
      />
      Loading…
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SignalGraphProvider>
        <ToastProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/lab/:practicumId" element={<LabWorkbench />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </SignalGraphProvider>
    </BrowserRouter>
  );
}

export default App;
