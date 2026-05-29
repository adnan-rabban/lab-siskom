'use client';
import ModuleLayout from '@/components/module/ModuleLayout';
import { FM_CONFIG } from '@/lib/modules/configs';

export default function FMPage() {
  return <ModuleLayout config={FM_CONFIG} />;
}