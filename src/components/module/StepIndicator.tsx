'use client';

import { useModuleStore } from '../../store/moduleStore';
import { ModuleConfig } from '../../types/modules';

interface StepIndicatorProps {
  config: ModuleConfig;
}

export default function StepIndicator({ config }: StepIndicatorProps) {
  const { currentStep, completedSteps, goToStep } = useModuleStore();
  const totalSteps = config.steps.length;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 16px',
      backgroundColor: '#0F172A',
      borderBottom: '1px solid #1E293B',
      overflow: 'hidden',
    }}>
      {/* Step counter */}
      <span style={{
        fontSize: 11,
        color: '#475569',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        Langkah {currentStep + 1} / {totalSteps}
      </span>

      {/* Progress dots */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        overflow: 'hidden',
      }}>
        {config.steps.map((step, i) => {
          const isDone    = completedSteps.has(i);
          const isCurrent = i === currentStep;

          return (
            <button
              key={step.id}
              onClick={() => goToStep(i)}
              title={step.title}
              style={{
                width: isCurrent ? 24 : 10,
                height: 10,
                borderRadius: 5,
                border: 'none',
                backgroundColor: isDone
                  ? '#10B981'
                  : isCurrent
                  ? '#3B82F6'
                  : '#1E293B',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
                transition: 'all 0.2s',
                boxShadow: isCurrent ? '0 0 6px rgba(59,130,246,0.5)' : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Current step title */}
      <span style={{
        fontSize: 11,
        color: '#94A3B8',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        maxWidth: 240,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {config.steps[currentStep]?.title}
      </span>

      {/* Progress percentage */}
      <div style={{
        fontSize: 10,
        color: '#10B981',
        fontFamily: 'monospace',
        flexShrink: 0,
        backgroundColor: '#0D2D1A',
        border: '1px solid #166534',
        borderRadius: 4,
        padding: '1px 6px',
      }}>
        {Math.round((completedSteps.size / totalSteps) * 100)}%
      </div>
    </div>
  );
}