import { useState, useCallback } from 'react';
import type { ProcedureStep } from '../engine/types';
import { useSignalGraph } from '../engine/SignalGraphContext';

interface StepGuideProps {
  steps: ProcedureStep[];
  currentStep: number;
  onStepClick: (stepNumber: number) => void;
  completedSteps?: number;
}

export default function StepGuide({ steps, currentStep, onStepClick, completedSteps }: StepGuideProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useSignalGraph();

  const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);

  const completed = completedSteps ?? (currentStep - 1);
  const progressPct = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

  return (
    <div className="step-guide">
      <div className="step-guide-header" onClick={toggleOpen} role="button" tabIndex={0}>
        <span className="step-guide-title">
          {t('Langkah Kerja', 'Procedure Steps')}
          <span style={{ marginLeft: '8px', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 'var(--fw-regular)' as any }}>
            {completed}/{steps.length}
          </span>
        </span>
        <span className={`step-guide-toggle ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      {/* Progress Bar */}
      <div className="step-guide-progress">
        <div className="step-guide-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <div className={`step-guide-body ${isOpen ? 'open' : ''}`}>
        <div className="step-guide-list">
          {steps.map((step) => {
            const isActive = step.stepNumber === currentStep;
            const isCompleted = step.stepNumber < currentStep;
            return (
              <div
                key={step.stepNumber}
                className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => onStepClick(step.stepNumber)}
                role="button"
                tabIndex={0}
              >
                <div className="step-number">
                  {isCompleted ? '✓' : step.stepNumber}
                </div>
                <div className="step-text">
                  {t(step.instructionId, step.instruction)}
                  {step.observation && isActive && (
                    <div style={{
                      marginTop: '6px',
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--accent-amber)',
                      fontStyle: 'italic',
                    }}>
                      📝 {t(step.observationId || step.observation, step.observation)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
