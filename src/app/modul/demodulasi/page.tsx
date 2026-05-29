'use client';
import ModuleLayout from '@/components/module/ModuleLayout';
import { DEMOD_CONFIG } from '@/lib/modules/configs';

export default function DemodPage() {
  return <ModuleLayout config={DEMOD_CONFIG} />;
}