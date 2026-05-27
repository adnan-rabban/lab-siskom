// src/app/workbench/page.tsx
import WorkbenchCanvas from '@/components/workbench/WorkbenchCanvas';

export default function WorkbenchPage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <WorkbenchCanvas />
    </div>
  );
}