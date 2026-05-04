import { useState, useCallback } from 'react';
import { FileText, X, Printer } from 'lucide-react';

interface ReportExporterProps {
  practicumTitle: string;
  moduleCode: string;
  connections: { id: string; fromNodeId: string; fromPortId: string; toNodeId: string; toPortId: string; connected: boolean }[];
  measurements: Record<string, Record<string, string>>;
  oscilloscopeCanvasId?: string;
  t: (id: string, en: string) => string;
}

export default function ReportExporter({
  practicumTitle,
  moduleCode,
  connections,
  measurements,
  oscilloscopeCanvasId = 'oscilloscope-canvas',
  t,
}: ReportExporterProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentNIM, setStudentNIM] = useState('');


  const handleExport = useCallback(() => {
    // Capture oscilloscope canvas
    let scopeDataUrl = '';
    const canvas = document.getElementById(oscilloscopeCanvasId) as HTMLCanvasElement | null;
    if (canvas) {
      try {
        scopeDataUrl = canvas.toDataURL('image/png');
      } catch { /* CORS or security error */ }
    }

    const date = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });



    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Lab Report - ${practicumTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12pt; color: #1a1a1a; padding: 20mm; line-height: 1.6; }
    h1 { font-size: 16pt; text-align: center; margin-bottom: 4px; }
    h2 { font-size: 13pt; margin: 16px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #ccc; }
    .header-section { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #333; padding-bottom: 16px; }
    .module-code { font-family: monospace; color: #666; font-size: 11pt; }
    .student-info { display: grid; grid-template-columns: 120px 1fr; gap: 4px 8px; margin: 12px 0; }
    .student-info dt { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 11pt; }
    th { background: #f5f5f5; font-weight: 600; }
    .scope-img { max-width: 100%; border: 1px solid #ccc; margin: 8px 0; border-radius: 4px; }
    .footer { margin-top: 40px; text-align: center; font-size: 10pt; color: #888; border-top: 1px solid #ccc; padding-top: 12px; }
    .connected { color: #16a34a; font-weight: 600; }
    @media print { body { padding: 15mm; } }
  </style>
</head>
<body>
  <div class="header-section">
    <h1>LAPORAN PRAKTIKUM</h1>
    <p class="module-code">${moduleCode} — ${practicumTitle}</p>
  </div>

  <dl class="student-info">
    <dt>Nama</dt><dd>${studentName || '___________________'}</dd>
    <dt>NIM</dt><dd>${studentNIM || '___________________'}</dd>
    <dt>Tanggal</dt><dd>${date}</dd>
  </dl>

  <h2>Koneksi Kabel</h2>
  <table>
    <thead><tr><th>Dari</th><th>Ke</th><th>Status</th></tr></thead>
    <tbody>
      ${connections.map(c => `
        <tr>
          <td>${c.fromNodeId}.${c.fromPortId}</td>
          <td>${c.toNodeId}.${c.toPortId}</td>
          <td class="${c.connected ? 'connected' : ''}">${c.connected ? '✓ Terhubung' : '— Tidak'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${scopeDataUrl ? `
  <h2>Tampilan Osiloskop</h2>
  <img src="${scopeDataUrl}" class="scope-img" alt="Oscilloscope capture" />
  ` : ''}

  <h2>Tabel Pengukuran</h2>
  <table>
    <thead><tr><th>Pengukuran</th><th>Nilai</th></tr></thead>
    <tbody>
      ${Object.entries(measurements).map(([rowId, fields]) =>
        Object.entries(fields).map(([fieldId, value]) =>
          `<tr><td>${rowId} — ${fieldId}</td><td>${value || '—'}</td></tr>`
        ).join('')
      ).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Virtual Laboratory Simulator — PUDAK Scientific PTE Series</p>
    <p>Generated on ${date}</p>
  </div>
</body>
</html>`;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }

    setShowDialog(false);
  }, [practicumTitle, moduleCode, connections, measurements, oscilloscopeCanvasId, studentName, studentNIM]);

  return (
    <>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setShowDialog(true)}
        title={t('Unduh Laporan', 'Download Report')}
      >
        <FileText size={12} /> {t('Laporan', 'Report')}
      </button>

      {showDialog && (
        <div className="scorecard-overlay" onClick={() => setShowDialog(false)}>
          <div className="scorecard-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="scorecard-header">
              <h2 className="scorecard-title">{t('Ekspor Laporan', 'Export Report')}</h2>
              <button className="scorecard-close" onClick={() => setShowDialog(false)}><X size={16} /></button>
            </div>
            <div className="scorecard-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                <label style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                  {t('Nama Mahasiswa', 'Student Name')}
                  <input
                    type="text"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    placeholder={t('Masukkan nama...', 'Enter name...')}
                    style={{
                      width: '100%',
                      marginTop: '4px',
                      padding: 'var(--sp-2) var(--sp-3)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--fs-base)',
                    }}
                  />
                </label>
                <label style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                  NIM
                  <input
                    type="text"
                    value={studentNIM}
                    onChange={e => setStudentNIM(e.target.value)}
                    placeholder={t('Masukkan NIM...', 'Enter student ID...')}
                    style={{
                      width: '100%',
                      marginTop: '4px',
                      padding: 'var(--sp-2) var(--sp-3)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--fs-base)',
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="scorecard-footer">
              <button className="btn btn-secondary" onClick={() => setShowDialog(false)}>
                {t('Batal', 'Cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleExport}>
                <Printer size={12} /> {t('Cetak Laporan', 'Print Report')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
