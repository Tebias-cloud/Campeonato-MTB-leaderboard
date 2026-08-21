/**
 * excel-parser.ts
 *
 * Utilidad para convertir un archivo Excel (XLS/XLSX/CSV) descargado de
 * TimingChip / RaceResult en un bloque de texto estructurado que el sistema
 * de importacion (RIDER_REGEX) puede procesar de forma identica a un PDF.
 *
 * Estrategia de Categorias (3 niveles):
 *   Nivel 1: Columna de categoria explicita en el Excel ("Cat", "Category", etc.)
 *   Nivel 2: Busqueda en eventRiders/riders por Dorsal o Nombre (resuelto externamente)
 *   Nivel 3: Fallback a la categoria activa del dropdown del panel (pasada como argumento)
 */

export interface ExcelParseOptions {
  /** Categoria de fallback (Nivel 3): la que esta seleccionada en el dropdown. */
  fallbackCategory: string;
}

export interface ExcelParseResult {
  /** Texto listo para alimentar a setImportText() y ser parseado por RIDER_REGEX. */
  text: string;
  /** Advertencias sobre filas que se omitieron o tuvieron problemas. */
  warnings: string[];
}

// Aliases de encabezados reconocidos (case-insensitive via normalizeHeader)
const POSITION_ALIASES  = ['PL.', 'PL', 'POS', 'POS.', 'LUGAR', 'PUESTO', 'RANK', '#', 'PLACE'];
const BIB_ALIASES       = ['BIB', 'DORSAL', 'NUM', 'NUMERO', 'N', 'NO.', 'NO', 'NUMBER', 'BIB#'];
const NAME_ALIASES      = ['NAME', 'NOMBRE', 'ATLETA', 'CORREDOR', 'RIDER', 'NOMBRE COMPLETO', 'FULL NAME'];
const FIRST_NAME_ALIASES= ['FIRST NAME', 'FIRSTNAME', 'PRIMER NOMBRE', 'NOMBRE1'];
const LAST_NAME_ALIASES = ['LAST NAME', 'LASTNAME', 'APELLIDO', 'APELLIDOS', 'SURNAME'];
const TIME_ALIASES      = ['TIME', 'TIEMPO', 'FINISH', 'NET TIME', 'GUN TIME', 'TIEMPO OFICIAL', 'OFICIAL', 'FINISH TIME', 'TOTAL TIME'];
const STATUS_ALIASES    = ['STATUS', 'ESTADO', 'RESULT'];
const CATEGORY_ALIASES  = ['CAT', 'CAT.', 'CATEGORY', 'CATEGORIA', 'CATEGOR' + '\u00cdA', 'GRUPO', 'MODALIDAD', 'CLASS'];
const CAT_KEYWORDS      = ['MASTER', 'ELITE', 'NOVICIO', 'DAMAS', 'VARONES', 'MIXTO', 'PRO', 'INFANTIL', 'JUVENIL', 'CADETE', 'SUB', 'EBIKE', 'ENDURO'];
const DNF_FLAGS         = ['DNF', 'DNS', 'DSQ', 'DQ', 'NC', 'NF'];

const normalizeHeader = (h: string) =>
  h.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const findColIndex = (headers: string[], aliases: string[]): number => {
  const normalized = headers.map(normalizeHeader);
  return normalized.findIndex(h => aliases.includes(h));
};

/**
 * Decodifica entidades HTML numericas (ej: &#205; → Í, &#209; → Ñ).
 * Los archivos .xls de TimingChip codifican acentos y caracteres especiales
 * como entidades HTML, lo que rompe el RIDER_REGEX al introducir dígitos en el nombre.
 */
const decodeHtmlEntities = (str: string): string =>
  str.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));


/**
 * Convierte el valor de tiempo del Excel al formato esperado por RIDER_REGEX.
 * Maneja: strings HH:MM:SS(.ms), numeros flotantes (fracciones de dia), ISO datetimes.
 */
export const normalizeExcelTime = (raw: any): string | null => {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim().toUpperCase();
  if (!str) return null;

  // Flag de no-finalizacion
  if (DNF_FLAGS.includes(str)) return str;

  // Patron de tiempo completo: H:MM:SS o HH:MM:SS con milisegundos opcionales
  const timePattern = /^(\d{1,2}):(\d{2}):(\d{2})([.,]\d+)?$/;
  if (timePattern.test(str)) {
    return str.replace(',', '.').replace(/(\.\d{2})\d+$/, '$1');
  }

  // Solo MM:SS
  const shortPattern = /^(\d{1,2}):(\d{2})$/;
  if (shortPattern.test(str)) return str;

  // Numero flotante = fraccion de dia en Excel
  const num = parseFloat(str.replace(',', '.'));
  if (!isNaN(num) && num > 0 && num < 1) {
    const totalSec = Math.round(num * 86400);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  // ISO datetime embebido (ej: "1899-12-30T01:23:45.000Z")
  const isoMatch = str.match(/T(\d{2}:\d{2}:\d{2})/);
  if (isoMatch) return isoMatch[1];

  return null;
};

/**
 * Convierte filas crudas de xlsx.utils.sheet_to_json (header:1, raw:false)
 * en texto listo para el importador RIDER_REGEX.
 */
export function parseExcelRows(rows: any[][], options: ExcelParseOptions): ExcelParseResult {
  const { fallbackCategory } = options;
  const warnings: string[] = [];

  if (!rows || rows.length < 2) {
    return { text: '', warnings: ['El archivo esta vacio o no tiene datos.'] };
  }

  const header = rows[0].map((h: any) => String(h ?? ''));

  const plIdx        = findColIndex(header, POSITION_ALIASES);
  const bibIdx       = findColIndex(header, BIB_ALIASES);
  const nameIdx      = findColIndex(header, NAME_ALIASES);
  const firstNameIdx = findColIndex(header, FIRST_NAME_ALIASES);
  const lastNameIdx  = findColIndex(header, LAST_NAME_ALIASES);
  const timeIdx      = findColIndex(header, TIME_ALIASES);
  const statusIdx    = findColIndex(header, STATUS_ALIASES);
  const catIdx       = findColIndex(header, CATEGORY_ALIASES);

  if (bibIdx === -1) warnings.push('No se encontro columna de Dorsal (Bib). Usando columna 1 como fallback.');
  if (timeIdx === -1 && statusIdx === -1) warnings.push('No se encontro columna de Tiempo ni Estado.');

  const _plIdx   = plIdx  !== -1 ? plIdx  : 0;
  const _bibIdx  = bibIdx !== -1 ? bibIdx : 1;
  const _timeIdx = timeIdx !== -1 ? timeIdx : 7;

  let currentCategory = fallbackCategory;
  let lines = '';

  const cell = (row: any[], idx: number) =>
    (idx !== -1 && row[idx] !== undefined && row[idx] !== null) ? String(row[idx]).trim() : '';

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const bibVal = cell(row, _bibIdx);

    // Fila-separador de categoria (sin dorsal o dorsal no numerico)
    if (!bibVal || isNaN(Number(bibVal))) {
      const rowText = row.filter(Boolean).join(' ').toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (CAT_KEYWORDS.some(kw => rowText.includes(kw))) {
        currentCategory = rowText.replace(/^(CATEGOR[IA]A?|CAT\.)\s*[:\-]?\s*/i, '').trim();
      }
      continue;
    }

    // Nivel 1: categoria desde columna explicita
    const rowCategory = catIdx !== -1 ? cell(row, catIdx) : '';
    if (rowCategory) {
      currentCategory = rowCategory.toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    if (!currentCategory) currentCategory = fallbackCategory;

    // Nombre
    let name = '';
    if (nameIdx !== -1) {
      name = cell(row, nameIdx);
    } else if (firstNameIdx !== -1 || lastNameIdx !== -1) {
      name = `${cell(row, firstNameIdx)} ${cell(row, lastNameIdx)}`.trim();
    }
    // Decodificar entidades HTML (&#205; → Í, &#209; → Ñ, etc.) antes de limpiar
    name = decodeHtmlEntities(name);
    name = name.replace(/[()[\]]/g, '').replace(/\s+/g, ' ').trim();
    if (!name) { warnings.push(`Fila ${i + 1}: sin nombre. Omitida.`); continue; }

    // Tiempo / Estado
    let timeRaw = cell(row, _timeIdx);
    if (statusIdx !== -1) {
      const statusVal = cell(row, statusIdx).toUpperCase();
      if (DNF_FLAGS.includes(statusVal)) timeRaw = statusVal;
    }
    const time = normalizeExcelTime(timeRaw);
    if (!time) { warnings.push(`Fila ${i + 1} (${name}): tiempo "${timeRaw}" no reconocido. Omitida.`); continue; }

    const pl = cell(row, _plIdx) || '';

    // Emitir la linea en formato PDF: "[Puesto] [Dorsal] [Nombre] [Tiempo]"
    lines += `${pl} ${bibVal} ${name} ${time}\n`;
  }

  // El header de categoria permite al sistema de Nivel 2 (eventRiders) tomar precedencia
  const categoryHeader = `CATEGORIA: ${currentCategory}\n`;
  return { text: categoryHeader + lines, warnings };
}
