'use client';
import ModuleLayout from '@/components/module/ModuleLayout';
import { DIGITAL_CONFIG } from '@/lib/modules/configs';

export default function DigitalPage() {
  return <ModuleLayout config={DIGITAL_CONFIG} />;
}