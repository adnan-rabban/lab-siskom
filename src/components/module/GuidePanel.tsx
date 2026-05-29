'use client';

import { useState } from 'react';
import { useModuleStore } from '../../store/moduleStore';
import { ModuleConfig, PracticeStep } from '../../types/modules';
import { useWorkbenchStore } from '../../store/workbenchStore';
import { validateConnection } from '../../lib/workbench/connectionManager';
import { describeConnection } from '../../lib/workbench/connectionManager';

interface GuidePanelProps {
  config: ModuleConfig;
}

// Satu item langkah
function StepItem({
  step, isActive, isDone, onClick,
}: {
  step: PracticeStep; isActive: boolean; isDone: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '8px 10px',
        backgroundColor: isActive ? '#1E3A5F' : isDone ? '#0D2D1A' : 'transparent',
        border: 'none',
        borderLeft: `3px solid ${isActive ? '#3B82F6' : isDone ? '#10B981' : '#1E293B'}`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'flex-start', gap: 8,
        transition: 'background-color 0.15s',
      }}
    >
      {/* Status icon */}
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        backgroundColor: isDone ? '#10B981' : isActive ? '#3B82F6' : '#1E293B',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: '#F9FAFB', fontWeight: 700,
        marginTop: 1,
      }}>
        {isDone ? '✓' : step.id + 1}
      </div>

      <span style={{
        fontSize: 12,
        color: isActive ? '#BFDBFE' : isDone ? '#86EFAC' : '#64748B',
        lineHeight: 1.3,
        fontWeight: isActive ? 500 : 400,
      }}>
        {step.title}
      </span>
    </button>
  );
}

// Validasi koneksi otomatis
function ConnectionChecker({
  step, cables,
}: {
  step: PracticeStep;
  cables: Array<{ fromPortId: string; toPortId: string }>;
}) {
  if (!step.requiredConnections?.length) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 4, fontWeight: 500 }}>
        Koneksi yang diperlukan:
      </div>
      {step.requiredConnections.map((req, i) => {
        const isConnected = cables.some(
          (c: any) =>
            (c.fromPortId === req.fromPortId && c.toPortId === req.toPortId) ||
            (c.fromPortId === req.toPortId && c.toPortId === req.fromPortId)
        );
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 6px', marginBottom: 2,
            backgroundColor: isConnected ? '#0D2D1A' : '#1E293B',
            borderRadius: 4,
            border: `1px solid ${isConnected ? '#166534' : '#334155'}`,
          }}>
            <span style={{ fontSize: 14 }}>{isConnected ? '✓' : '○'}</span>
            <span style={{
              fontSize: 10,
              color: isConnected ? '#86EFAC' : '#94A3B8',
              fontFamily: 'monospace',
            }}>
              {req.description ?? describeConnection(req.fromPortId, req.toPortId)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Komponen utama
export default function GuidePanel({ config }: GuidePanelProps) {
  const {
    currentStep, completedSteps, feedback,
    isGuidePanelOpen, toggleGuidePanel,
    goToStep, nextStep, prevStep, completeStep, setFeedback,
  } = useModuleStore();
  const cables = useWorkbenchStore(s => s.cables);

  const [showHint, setShowHint] = useState(false);

  const step = config.steps[currentStep];
  if (!step) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep  = currentStep === config.steps.length - 1;
  const isDone      = completedSteps.has(currentStep);

  // Validasi koneksi untuk step yang membutuhkannya
  const allConnectionsMet = !step.requiredConnections?.length ||
    step.requiredConnections.every(req =>
      cables.some((c: any) =>
        (c.fromPortId === req.fromPortId && c.toPortId === req.toPortId) ||
        (c.fromPortId === req.toPortId && c.toPortId === req.fromPortId)
      )
    );

  const handleNext = () => {
    if (step.validation?.type === 'connection' && !allConnectionsMet) {
      setFeedback({
        stepId: currentStep,
        isValid: false,
        message: 'Sambungkan kabel yang diperlukan terlebih dahulu.',
      });
      return;
    }
    completeStep(currentStep);
    setFeedback(null);
    setShowHint(false);
    nextStep();
  };

  const handleManualConfirm = () => {
    completeStep(currentStep);
    setFeedback({ stepId: currentStep, isValid: true, message: 'Langkah selesai! ✓' });
    setTimeout(nextStep, 600);
  };

  // Panel tersembunyi — hanya tampilkan tab kecil
  if (!isGuidePanelOpen) {
    return (
      <div style={{
        width: 28, flexShrink: 0,
        backgroundColor: '#0F172A',
        borderRight: '1px solid #1E293B',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingTop: 12,
      }}>
        <button
          onClick={toggleGuidePanel}
          title="Buka panduan"
          style={{
            width: 22, padding: '6px 0',
            backgroundColor: '#1E293B', border: '1px solid #334155',
            borderRadius: 4, cursor: 'pointer',
            color: '#64748B', fontSize: 10,
            writingMode: 'vertical-rl',
          }}
        >
          ▶ Panduan
        </button>
        {/* Step progress mini */}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {config.steps.map((s, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: completedSteps.has(i) ? '#10B981'
                : i === currentStep ? '#3B82F6' : '#1E293B',
            }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: 280, flexShrink: 0,
      backgroundColor: '#0F172A',
      borderRight: '1px solid #1E293B',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Panel header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid #1E293B',
        backgroundColor: '#0B1222',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#3B82F6', fontWeight: 600, letterSpacing: '0.04em' }}>
            PANDUAN PRAKTIKUM
          </div>
          <div style={{ fontSize: 10, color: '#475569' }}>{config.subtitle}</div>
        </div>
        <button
          onClick={toggleGuidePanel}
          style={{
            width: 22, height: 22,
            backgroundColor: '#1E293B', border: '1px solid #334155',
            borderRadius: 4, cursor: 'pointer', color: '#64748B', fontSize: 10,
          }}
          title="Sembunyikan panduan"
        >
          ◀
        </button>
      </div>

      {/* Step list (scrollable) */}
      <div style={{ overflowY: 'auto', flex: '0 0 auto', maxHeight: 200, borderBottom: '1px solid #1E293B' }}>
        {config.steps.map((s, i) => (
          <StepItem
            key={s.id}
            step={s}
            isActive={i === currentStep}
            isDone={completedSteps.has(i)}
            onClick={() => goToStep(i)}
          />
        ))}
      </div>

      {/* Active step detail */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {/* Step title */}
        <div style={{
          fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            backgroundColor: '#1D4ED8', color: '#BFDBFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, flexShrink: 0,
          }}>
            {currentStep + 1}
          </span>
          {step.title}
        </div>

        {/* Instruction */}
        <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
          {step.instruction}
        </p>

        {/* Hint */}
        {step.hint && (
          <div style={{ marginTop: 10 }}>
            {!showHint ? (
              <button
                onClick={() => setShowHint(true)}
                style={{
                  fontSize: 11, color: '#F59E0B',
                  backgroundColor: 'transparent', border: '1px solid #78350F',
                  borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
                }}
              >
                💡 Tampilkan Hint
              </button>
            ) : (
              <div style={{
                backgroundColor: '#1C1400', border: '1px solid #78350F',
                borderRadius: 4, padding: '8px 10px',
              }}>
                <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 600, marginBottom: 4 }}>
                  💡 Hint
                </div>
                <p style={{ fontSize: 11, color: '#FDE68A', margin: 0, lineHeight: 1.5 }}>
                  {step.hint}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Connection checker */}
        <ConnectionChecker step={step} cables={cables} />

        {/* Feedback */}
        {feedback && feedback.stepId === currentStep && (
          <div style={{
            marginTop: 10, padding: '8px 10px', borderRadius: 4,
            backgroundColor: feedback.isValid ? '#0D2D1A' : '#1C0A0A',
            border: `1px solid ${feedback.isValid ? '#166534' : '#7F1D1D'}`,
          }}>
            <span style={{ fontSize: 11, color: feedback.isValid ? '#86EFAC' : '#FCA5A5' }}>
              {feedback.message}
            </span>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid #1E293B',
        display: 'flex', gap: 6,
      }}>
        <button
          onClick={prevStep}
          disabled={isFirstStep}
          style={{
            flex: 1, padding: '6px',
            backgroundColor: '#1E293B',
            border: '1px solid #334155', borderRadius: 4,
            color: isFirstStep ? '#334155' : '#94A3B8',
            cursor: isFirstStep ? 'not-allowed' : 'pointer',
            fontSize: 12,
          }}
        >
          ← Sebelumnya
        </button>

        {step.validation?.type === 'manual' || step.validation?.type === 'observe' ? (
          <button
            onClick={handleManualConfirm}
            style={{
              flex: 2, padding: '6px',
              backgroundColor: '#14532D',
              border: '1px solid #16A34A', borderRadius: 4,
              color: '#86EFAC', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            ✓ {step.validation.confirmLabel ?? 'Konfirmasi'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={isLastStep && isDone}
            style={{
              flex: 2, padding: '6px',
              backgroundColor: allConnectionsMet ? '#1D4ED8' : '#1E293B',
              border: `1px solid ${allConnectionsMet ? '#3B82F6' : '#334155'}`,
              borderRadius: 4,
              color: allConnectionsMet ? '#BFDBFE' : '#475569',
              cursor: isLastStep && isDone ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 500,
            }}
          >
            {isLastStep ? 'Selesai ✓' : 'Selanjutnya →'}
          </button>
        )}
      </div>
    </div>
  );
}