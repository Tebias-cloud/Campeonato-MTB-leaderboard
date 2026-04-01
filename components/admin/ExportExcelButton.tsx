'use client';

import * as XLSX from 'xlsx-js-style';

interface Props {
  data: Record<string, unknown>[];
  fileName: string;
}

// ✅ Creamos este "molde" para que TypeScript sepa exactamente qué es un estilo
// y deje de molestar con el error "unexpected any".
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

export default function ExportExcelButton({ data, fileName }: Props) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

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

        // ✅ Usamos nuestro nuevo molde en lugar de "any"
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
        } 
        else if (row % 2 === 0) {
          cellStyle.fill = { fgColor: { rgb: 'F8FAFC' } };
        }

        worksheet[cellAddress].s = cellStyle;
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <button 
      onClick={handleExport}
      className="bg-[#107C41] hover:bg-[#0B5A2F] text-white px-6 py-3 rounded-2xl font-heading text-xl uppercase italic shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 border-b-4 border-black/20"
      title="Descargar en formato Excel"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      DESCARGAR EXCEL
    </button>
  );
}