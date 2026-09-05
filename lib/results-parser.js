"use strict";
// lib/results-parser.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORY_KEYWORDS = exports.RIDER_REGEX = void 0;
exports.parseRiderLine = parseRiderLine;
exports.parseResultsText = parseResultsText;
// Regex unificado para capturar puestos, dorsales, nombres (incluso con números, apóstrofes o paréntesis) y tiempos o DNF/DNS/DQ
exports.RIDER_REGEX = /(?:^|\s)(?:(\d+)\s+)?(\d+)\s+([A-ZÁÉÍÓÚÑÜÄËÏÖ][A-ZÁÉÍÓÚÑÜÄËÏÖ0-9\s()\.#&'’/\-]*?)\s+(\d{1,2}:[\d:.]+|DQ|DNF|DNS|DSQ|NC)/gi;
exports.CATEGORY_KEYWORDS = ['MASTER', 'ELITE', 'NOVICIO', 'DAMAS', 'VARONES', 'MIXTO', 'PRO', 'INFANTIL', 'JUVENIL', 'CADETE', 'SUB', 'EBIKE', 'ENDURO'];
function parseRiderLine(line) {
    const matches = Array.from(line.matchAll(exports.RIDER_REGEX));
    if (matches.length === 0)
        return [];
    return matches.map(match => {
        const time = match[4].toUpperCase();
        const isDQ = ["DQ", "DNF", "DNS", "DSQ", "NC"].includes(time);
        const position = match[1] ? parseInt(match[1]) : (isDQ ? 999 : -1);
        return {
            position,
            dorsal: parseInt(match[2]),
            riderName: match[3].trim(),
            time,
            isDQ,
            originalText: match[0].trim()
        };
    });
}
function parseResultsText(fullText, fallbackCategory = 'DESCONOCIDA') {
    if (!fullText || !fullText.trim())
        return [];
    const categoryMarkers = [];
    // Patrón A: '[CATEGORÍA] PUESTO DORSAL NOMBRE TIEMPO' (formato PDF)
    const pdfCatRegex = /([A-ZÁÉÍÓÚÑÜÄËÏÖ\s-]{3,40}?)\s+PUESTO\s+DORSAL\s+NOMBRE\s+TIEMPO/gi;
    for (const match of fullText.matchAll(pdfCatRegex)) {
        let rawCat = match[1].trim().toUpperCase();
        rawCat = rawCat.replace(/.*?\b(RESULTADOS|GENERALES|PAGINA|\d+\/\d+)\s*/i, '').trim();
        rawCat = rawCat.replace(/^(DQ|DNF|DNS|DSQ|NC)\s+/i, '').trim();
        rawCat = rawCat.replace(/^(CATEGOR[IÍ]A|CATEGORIA|CAT\.|RANKING|FECHA)\s*[:\-]?\s*/i, '').trim();
        if (exports.CATEGORY_KEYWORDS.some(kw => rawCat.includes(kw))) {
            if (rawCat.includes('PRE MASTER') || rawCat.includes('PREMASTER'))
                rawCat = 'PRE MASTER MIXTO';
            categoryMarkers.push({ index: match.index ?? 0, category: rawCat });
        }
    }
    // Patrón B: 'CATEGORIA: [NOMBRE]' (formato Excel o líneas explícitas)
    const excelCatRegex = /CATEGOR[IÍ]A\s*:\s*([^\r\n]+)/gi;
    for (const match of fullText.matchAll(excelCatRegex)) {
        let rawCat = match[1].trim().toUpperCase();
        if (rawCat.includes('PRE MASTER') || rawCat.includes('PREMASTER'))
            rawCat = 'PRE MASTER MIXTO';
        categoryMarkers.push({ index: match.index ?? 0, category: rawCat });
    }
    // Patrón C: Líneas individuales de categoría
    const lines = fullText.split(/\r?\n/);
    let charPos = 0;
    for (const line of lines) {
        const cleanLine = line.trim();
        const upper = cleanLine.toUpperCase();
        const isNoise = upper.includes('PUESTO') || upper.includes('DORSAL') || upper.includes('PAGINA') || upper.includes('RESULTADOS') || upper.includes('OFICIAL') || upper.includes('TIEMPO');
        if (exports.CATEGORY_KEYWORDS.some(kw => upper.includes(kw)) && !isNoise && upper.length < 60 && !upper.match(/\d{1,2}:\d{2}/)) {
            let detected = upper.replace(/^(CATEGOR[IÍ]A|CATEGORIA|CAT\.|RANKING|RESULTADOS|FECHA)\s*[:\-]?\s*/i, '').trim();
            if (detected.includes('PRE MASTER') || detected.includes('PREMASTER'))
                detected = 'PRE MASTER MIXTO';
            categoryMarkers.push({ index: charPos, category: detected });
        }
        charPos += line.length + 1;
    }
    categoryMarkers.sort((a, b) => a.index - b.index);
    const results = [];
    for (const match of fullText.matchAll(exports.RIDER_REGEX)) {
        const idx = match.index ?? 0;
        const dorsal = match[2];
        const rawMatch = match[0].toUpperCase();
        const time = match[4].toUpperCase();
        const isDQ = ['DQ', 'DNF', 'DNS', 'DSQ', 'NC'].includes(time);
        const position = match[1] ? parseInt(match[1]) : (isDQ ? 999 : -1);
        const riderName = match[3].trim();
        if (dorsal.length === 4 && dorsal.startsWith('20'))
            continue;
        if (rawMatch.includes('PUESTO') || rawMatch.includes('DORSAL'))
            continue;
        let activeCat = fallbackCategory;
        for (const cm of categoryMarkers) {
            if (cm.index <= idx) {
                activeCat = cm.category;
            }
            else {
                break;
            }
        }
        results.push({
            position,
            dorsal: parseInt(dorsal),
            riderName,
            time,
            isDQ,
            category: activeCat,
            originalText: match[0].trim()
        });
    }
    return results;
}
