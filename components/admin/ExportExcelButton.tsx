'use client';

import * as XLSX from 'xlsx-js-style';

interface Props {
  data: Record<string, unknown>[];
  fileName: string;
  label?: string;
  format?: 'excel' | 'csv';
}

interface ExcelStyle {
  font?: { name?: string; sz?: number; color?: { rgb: string }; bold?: boolean };
  fill?: { fgColor: { rgb: string } };
  alignment?: { vertical?: string; horizontal?: string; wrapText?: boolean };
  border?: {
    top?: { style: string; color: { rgb: string } };
    bottom?: { style: string; color: { rgb: string } };
    left?: { style: string; color: { rgb: string } };
    right?: { style: string; color: { rgb: string } };
  };
}

export default function ExportExcelButton({ data, fileName, label = "DESCARGAR", format = 'excel' }: Props) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    if (format === 'csv') {
      // ✅ GENERACIÓN DE CSV "BALA DE PLATA 2.0"
      // Comas, Comillas y saltos de línea Windows (CRLF) para máxima compatibilidad
      
      const headers = Object.keys(data[0]);
      const rows = data.map(row => 
        headers.map(header => {
          // Limpiamos comillas existentes y envolvemos en comillas nuevas
          const val = row[header] ? String(row[header]).replace(/"/g, '""') : '';
          return `"${val}"`;
        }).join(',') // Volvemos a la COMA pero con COMILLAS
      );

      // Usamos \r\n (CRLF) que es el estándar de Windows / RaceTime
      const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
      
      // Agregamos el BOM (Byte Order Mark) para que Excel/RaceTime detecten UTF-8
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // ✅ EXPORTACIÓN EXCEL CON ESTILOS (SheetJS)
    const worksheet = XLSX.utils.json_to_sheet(data);
    const keys = Object.keys(data[0]);
    const colWidths = keys.map(key => {
      const maxContentLength = Math.max(
        ...data.map(row => (row[key] ? row[key].toString().length : 0)),
        key.length 
      );
      return { wch: maxContentLength + 4 }; 
    });
    worksheet['!cols'] = colWidths;

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellAddress]) continue;

        let cellStyle: ExcelStyle = {
          font: { name: 'Arial', sz: 11, color: { rgb: '333333' } },
          alignment: { vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'DDDDDD' } },
            bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
            left: { style: 'thin', color: { rgb: 'DDDDDD' } },
            right: { style: 'thin', color: { rgb: 'DDDDDD' } }
          }
        };

        if (row === 0) {
          cellStyle = {
            font: { name: 'Arial', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: 'C64928' } }, 
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'medium', color: { rgb: '1A1816' } },
              bottom: { style: 'medium', color: { rgb: '1A1816' } },
              left: { style: 'thin', color: { rgb: '1A1816' } },
              right: { style: 'thin', color: { rgb: '1A1816' } }
            }
          };
        } else if (row % 2 === 0) {
          cellStyle.fill = { fgColor: { rgb: 'F8FAFC' } };
        }
        worksheet[cellAddress].s = cellStyle;
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const isCsv = format === 'csv';

  return (
    <button 
      onClick={handleExport}
      className={`
        ${isCsv ? 'bg-[#1A1816] hover:bg-black' : 'bg-emerald-600 hover:bg-emerald-700'}
        text-white px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-widest
        shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
        flex items-center gap-2
      `}
      title={isCsv ? "Descargar CSV" : "Exportar Excel"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {isCsv ? (
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        ) : (
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/>
        )}
      </svg>
      {label}
    </button>
  );
}