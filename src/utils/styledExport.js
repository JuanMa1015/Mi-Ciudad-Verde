// src/utils/styledExport.js
import * as Sharing from 'expo-sharing';
// Usa la API legacy para evitar el warning de deprecación
import * as FileSystem from 'expo-file-system/legacy';

/** Formatea fechas (Date / Firestore Timestamp / ms) a "yyyy-MM-dd HH:mm" */
export function formatDateExport(value) {
  if (!value) return '';
  try {
    const d = value?.toDate ? value.toDate() :
              typeof value === 'number' ? new Date(value) :
              value instanceof Date ? value : new Date(String(value));
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

/** Genera HTML con tabla estilizada para que Excel la abra “bonita” */
export function makeStyledTable({ title, headers, rows, palette }) {
  const brand = palette?.brand ?? '#16A34A';
  const brandDark = palette?.brandDark ?? '#0F7A37';
  const rowAlt = palette?.rowAlt ?? '#F3FFF4';

  const thead = `
    <thead>
      <tr>
        ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
      </tr>
    </thead>`;

  const tbody = `
    <tbody>
      ${rows.map((r, i) => `
        <tr style="background:${i % 2 ? rowAlt : '#ffffff'}">
          ${r.map(c => `<td>${escapeHtml(c ?? '')}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>`;

  return `
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:16px;background:#fff;}
        h1{font-size:18px;margin:0 0 12px 0;color:${brandDark}}
        table{border-collapse:collapse;width:100%;}
        th,td{border:1px solid #e5e7eb;padding:8px 10px;font-size:12px;text-align:left;color:#111827;vertical-align:top}
        thead th{background:${brand};color:#fff;font-weight:700}
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title ?? 'Export')}</h1>
      <table>${thead}${tbody}</table>
    </body>
  </html>`;
}

function escapeHtml(v) {
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Guarda el HTML como .xls y abre el diálogo de compartir */
export async function saveAndShareXls({ html, baseFilename = 'export' }) {
  const filename = `${baseFilename}_${Date.now()}.xls`; // Excel abre HTML como libro
  const fileUri = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(fileUri, html, { encoding: FileSystem.EncodingType.UTF8 });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.ms-excel',
      dialogTitle: 'Exportar',
      UTI: 'com.microsoft.excel.xls',
    });
  }
  return fileUri;
}
