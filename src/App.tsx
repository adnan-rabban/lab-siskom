import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignalGraphProvider } from './engine/SignalGraphContext';
import Landing from './pages/Landing';
import LabWorkbench from './pages/LabWorkbench';

// Styles
import './index.css';
import './components/components.css';
import './modules/modules.css';
import './instruments/instruments.css';
import './pages/pages.css';

function App() {
  return (
    <BrowserRouter>
      <SignalGraphProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/lab/:practicumId" element={<LabWorkbench />} />
        </Routes>
      </SignalGraphProvider>
    </BrowserRouter>
  );
}

export default App;
