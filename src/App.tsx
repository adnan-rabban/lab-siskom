import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ── Lazy-loaded pages (code splitting) ────────────────────────
const Landing = lazy(() => import('./pages/Landing'));

// Styles
import './index.css';
import './pages/pages.css';

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
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
