'use client';
import ModuleLayout from '@/components/module/ModuleLayout';
import { AM_CONFIG } from '@/lib/modules/configs';

export default function AMPage() {
  return <ModuleLayout config={AM_CONFIG} />;
}