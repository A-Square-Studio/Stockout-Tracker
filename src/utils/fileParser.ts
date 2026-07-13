import * as XLSX from 'xlsx';

export type FileType = 'csv' | 'excel' | 'pdf';

export function detectType(file: File): FileType | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return 'csv';
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'excel';
  if (name.endsWith('.pdf')) return 'pdf';
  return null;
}

/** Reads any supported file and resolves to a CSV string (or rejects with an error message). */
export async function fileToCSV(file: File): Promise<string> {
  const type = detectType(file);
  if (!type) throw new Error('Unsupported file type. Please upload a CSV, Excel, or PDF file.');

  if (type === 'csv') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.readAsText(file);
    });
  }

  if (type === 'excel') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const buf = e.target?.result as ArrayBuffer;
          const wb = XLSX.read(buf, { type: 'array' });
          // Use the first sheet
          const ws = wb.Sheets[wb.SheetNames[0]];
          const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
          resolve(csv);
        } catch {
          reject(new Error('Could not read Excel file. Make sure it is a valid .xlsx or .xls file.'));
        }
      };
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.readAsArrayBuffer(file);
    });
  }

  // PDF — send to server for text extraction
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/parse-file', { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? 'PDF parsing failed on the server.');
  }
  const { text } = await res.json() as { text: string };
  return text;
}
