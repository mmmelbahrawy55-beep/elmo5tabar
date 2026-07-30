'use client';

import { useCallback, useState } from 'react';
import { Download, FileText, Table as TableIcon } from 'lucide-react';
import { Button } from '@/design-system/primitives/Button';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/design-system/navigation/Tabs';

export function useExport() {
  const [exporting, setExporting] = useState(false);

  const exportData = useCallback(async (
    data: Record<string, unknown>[],
    filename: string,
    format: 'pdf' | 'excel' | 'csv' = 'pdf',
    title?: string,
  ) => {
    setExporting(true);
    try {
      if (format === 'csv') {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csv = [
          headers.join(','),
          ...data.map(row => headers.map(h => {
            const val = row[h];
            return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val ?? '');
          }).join(','))
        ].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'excel') {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<?mso-application progid="Excel.Sheet"?>',
          '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">',
          '<Worksheet ss:Name="' + (title || filename) + '"><Table>',
          headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join(''),
          ...data.map(row => '<Row>' + headers.map(h => `<Cell><Data ss:Type="String">${String(row[h] ?? '')}</Data></Cell>`).join('') + '</Row>'),
          '</Table></Worksheet></Workbook>'
        ].join('');
        const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.xls`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const printWin = window.open('', '_blank');
        if (!printWin) return;
        const headers = data.length > 0 ? Object.keys(data[0]) : [];
        printWin.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><title>${title || filename}</title>
          <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#0077B6;color:white}tr:nth-child(even){background:#f5f5f5}.header{text-align:center;margin-bottom:20px}.logo{font-size:24px;font-weight:bold;color:#0077B6}</style>
          </head><body><div class="header"><div class="logo">المختبر | Al Mokhtabar</div><h2>${title || filename}</h2><p>${new Date().toLocaleDateString('ar-SA')}</p></div>
          <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${data.map(row => `<tr>${headers.map(h => `<td>${String(row[h] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>
          <script>window.print();</script></body></html>`);
        printWin.document.close();
      }
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportData, exporting };
}

export function ExportButton({ data, filename, title }: { data: Record<string, unknown>[]; filename: string; title?: string }) {
  const { exportData, exporting } = useExport();

  return (
    <Dropdown
      trigger={
        <Button variant="outline" size="sm" disabled={exporting}>
          <Download className="h-4 w-4 ms-2" />
          {exporting ? 'جاري التصدير...' : 'تصدير'}
        </Button>
      }
    >
      <DropdownItem onClick={() => exportData(data, filename, 'pdf', title)}>
        <FileText className="h-4 w-4 ms-2" />
        تصدير PDF
      </DropdownItem>
      <DropdownItem onClick={() => exportData(data, filename, 'excel', title)}>
        <TableIcon className="h-4 w-4 ms-2" />
        تصدير Excel
      </DropdownItem>
      <DropdownSeparator />
      <DropdownItem onClick={() => exportData(data, filename, 'csv', title)}>
        <Download className="h-4 w-4 ms-2" />
        تصدير CSV
      </DropdownItem>
    </Dropdown>
  );
}
