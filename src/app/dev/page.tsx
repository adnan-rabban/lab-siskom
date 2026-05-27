// src/app/dev/page.tsx
import FunctionGenerator from '@/components/instruments/FunctionGenerator'
import Oscilloscope from '@/components/instruments/Oscilloscope'
import FrequencyCounter from '@/components/instruments/FrequencyCounter'

export default function DevPage() {
  return (
    <div style={{ padding: 32, background: '#0F172A', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <FunctionGenerator instanceId="afg1" />
      <Oscilloscope />
      <FrequencyCounter />
    </div>
  )
}