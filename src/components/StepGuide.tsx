import { useState, useCallback } from 'react';
import type { ProcedureStep } from '../engine/types';
import { useSignalGraph } from '../engine/SignalGraphContext';

interface StepGuideProps {
  steps: ProcedureStep[];
  currentStep: number;
  onStepClick: (stepNumber: number) => void;
}

export default function StepGuide({ steps, currentStep, onStepClick }: StepGuideProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useSignalGraph();

  const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <div className="step-guide">
      <div className="step-guide-header" onClick={toggleOpen} role="button" tabIndex={0}>
        <span className="step-guide-title">
          {t('Langkah Kerja', 'Procedure Steps')}
        </span>
        <span className={`step-guide-toggle ${isOpen ? 'open' : ''}`}>▼</span>
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
