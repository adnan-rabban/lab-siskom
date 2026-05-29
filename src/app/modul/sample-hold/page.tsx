'use client';
import ModuleLayout from '@/components/module/ModuleLayout';
import { SAMPLE_HOLD_CONFIG } from '@/lib/modules/configs';

export default function SampleHoldPage() {
  return <ModuleLayout config={SAMPLE_HOLD_CONFIG} />;
}