import { parsePortId } from './workbench.types';
import { ConnectionValidation } from '../../types/signals';

// Tipe port: OUTPUT atau INPUT
function isOutputPort(portId: string): boolean {
  const outputKeywords = ['out', 'output', 'main_out', 'sync_out', 'mod_out'];
  const { portName } = parsePortId(portId);
  return outputKeywords.some(kw => portName.includes(kw));
}

function isInputPort(portId: string): boolean {
  return !isOutputPort(portId);
}

// Aturan koneksi
// Semua koneksi valid selama:
// 1. Bukan instrument yang sama
// 2. Arah: output → input (atau bidirectional untuk beberapa port)
// 3. Port tujuan belum punya kabel
// 4. Tidak konek output → output atau input → input

export function validateConnection(
  fromPortId: string,
  toPortId: string,
  existingCables: Array<{ fromPortId: string; toPortId: string }>
): ConnectionValidation {

  // Self-connection
  const { instanceId: fromInstr } = parsePortId(fromPortId);
  const { instanceId: toInstr }   = parsePortId(toPortId);

  if (fromInstr === toInstr) {
    return {
      isValid: false,
      error: 'same_instrument',
      message: `Tidak bisa menghubungkan dua port pada instrumen yang sama (${fromInstr}).`,
    };
  }

  // Duplikasi kabel
  const alreadyExists = existingCables.some(
    c => (c.fromPortId === fromPortId && c.toPortId === toPortId) ||
         (c.fromPortId === toPortId   && c.toPortId === fromPortId)
  );
  if (alreadyExists) {
    return {
      isValid: false,
      error: 'already_connected',
      message: 'Kabel antara dua port ini sudah ada.',
    };
  }

  // Input port sudah penuh (max 1 kabel masuk)
  const inputOccupied = existingCables.some(
    c => c.toPortId === toPortId
  );
  if (inputOccupied) {
    return {
      isValid: false,
      error: 'already_connected',
      message: `Port ${toPortId} sudah terhubung. Cabut kabel lama dulu.`,
    };
  }

  // Output → Output tidak diizinkan
  const fromIsOutput = isOutputPort(fromPortId);
  const toIsOutput   = isOutputPort(toPortId);

  if (fromIsOutput && toIsOutput) {
    return {
      isValid: false,
      error: 'type_mismatch',
      message: 'Tidak bisa menghubungkan dua port OUTPUT. Sambungkan OUTPUT → INPUT.',
    };
  }

  // Input → Input tidak diizinkan
  if (!fromIsOutput && !toIsOutput) {
    return {
      isValid: false,
      error: 'type_mismatch',
      message: 'Tidak bisa menghubungkan dua port INPUT. Sambungkan OUTPUT → INPUT.',
    };
  }

  return {
    isValid: true,
    error: null,
    message: 'Koneksi valid.',
  };
}

// Normalisasi arah kabel (selalu from=output, to=input)
// Kembalikan {fromPortId, toPortId} yang sudah benar arahnya.
export function normalizeDirection(
  portA: string,
  portB: string
): { fromPortId: string; toPortId: string } {
  if (isOutputPort(portA)) {
    return { fromPortId: portA, toPortId: portB };
  }
  return { fromPortId: portB, toPortId: portA };
}

// Deskripsi koneksi yang dapat dibaca manusia
export function describeConnection(fromPortId: string, toPortId: string): string {
  const labels: Record<string, string> = {
    'afg1_main_out': 'AFG① MAIN OUT',
    'afg1_sync_out': 'AFG① SYNC',
    'afg2_main_out': 'AFG② MAIN OUT',
    'afg2_sync_out': 'AFG② SYNC',
    'osc_ch1':       'OSC CH1',
    'osc_ch2':       'OSC CH2',
    'osc_ext_trig':  'OSC EXT TRIG',
    'gfc_input':     'GFC INPUT',
    'pudak_input_a': 'PUDAK IN-A',
    'pudak_input_b': 'PUDAK IN-B',
    'pudak_carrier_in': 'PUDAK CARRIER',
    'pudak_message_in': 'PUDAK MESSAGE',
    'pudak_output':  'PUDAK OUTPUT',
  };
  const from = labels[fromPortId] ?? fromPortId;
  const to   = labels[toPortId]   ?? toPortId;
  return `${from} → ${to}`;
}