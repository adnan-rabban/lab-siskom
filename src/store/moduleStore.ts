import { create } from 'zustand';
import { ModuleId } from '../types/modules';

export interface StepFeedback {
  stepId: number;
  isValid: boolean;
  message: string;
}

interface ModuleState {
  // Modul yang sedang aktif
  activeModuleId: ModuleId | null;

  // Step saat ini (0-based)
  currentStep: number;

  // Set step yang sudah selesai
  completedSteps: Set<number>;

  // Feedback validasi per step
  feedback: StepFeedback | null;

  // Panel guide terbuka atau tidak
  isGuidePanelOpen: boolean;

  // Signal monitor panel
  isSignalMonitorOpen: boolean;

  // Waktu mulai praktikum
  startedAt: number | null;

  // Actions
  setModule: (id: ModuleId) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeStep: (step: number) => void;
  setFeedback: (fb: StepFeedback | null) => void;
  toggleGuidePanel: () => void;
  toggleSignalMonitor: () => void;
  resetModule: () => void;
}

export const useModuleStore = create<ModuleState>()((set, get) => ({
  activeModuleId: null,
  currentStep: 0,
  completedSteps: new Set(),
  feedback: null,
  isGuidePanelOpen: true,
  isSignalMonitorOpen: false,
  startedAt: null,

  setModule: (id) => set({
    activeModuleId: id,
    currentStep: 0,
    completedSteps: new Set(),
    feedback: null,
    startedAt: Date.now(),
  }),

  goToStep: (step) => set({ currentStep: step, feedback: null }),

  nextStep: () => {
    const { currentStep, completedSteps } = get();
    const next = currentStep + 1;
    const updated = new Set(completedSteps);
    updated.add(currentStep);
    set({ currentStep: next, completedSteps: updated, feedback: null });
  },

  prevStep: () => set(s => ({
    currentStep: Math.max(0, s.currentStep - 1),
    feedback: null,
  })),

  completeStep: (step) => set(s => ({
    completedSteps: new Set([...s.completedSteps, step]),
  })),

  setFeedback: (fb) => set({ feedback: fb }),

  toggleGuidePanel: () => set(s => ({ isGuidePanelOpen: !s.isGuidePanelOpen })),
  toggleSignalMonitor: () => set(s => ({ isSignalMonitorOpen: !s.isSignalMonitorOpen })),

  resetModule: () => set({
    currentStep: 0,
    completedSteps: new Set(),
    feedback: null,
    startedAt: Date.now(),
  }),
}));