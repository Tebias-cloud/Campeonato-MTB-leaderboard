"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNameCompatible = exports.normalizeForMatch = exports.cleanInstagramHandle = exports.formatChileanPhone = exports.normalizeCategory = void 0;
const categories_1 = require("./categories");
/**
 * Unifica las categorías del campeonato para visualización en el admin y ranking.
 * Ejemplo: "Novicios Open (Recién empezando)" -> "Novicios Open"
 */
const normalizeCategory = (cat) => {
    if (!cat)
        return 'Sin Categoría';
    const clean = cat.split('(')[0].trim();
    const upper = clean.toUpperCase();
    // 1. Si coincide exactamente (case-insensitive) con una oficial, usar esa.
    const official = categories_1.OFFICIAL_CATEGORIES.find(c => c.label.toUpperCase() === upper);
    if (official)
        return official.label;
    // 2. Mapeos de compatibilidad con nombres viejos o variaciones
    if (upper.includes('NOVICIOS OPEN') || upper.includes('NOVICIOS VARONES'))
        return 'Novicios Varones';
    if (upper.includes('NOVICIAS OPEN') || upper.includes('NOVICIAS DAMAS'))
        return 'Novicias Damas';
    if (upper.includes('PRE MASTER') || upper.includes('PREMASTER'))
        return 'Pre Master Mixto';
    if (upper.includes('ENDURO'))
        return 'Enduro Mixto';
    if (upper.includes('E-BIKE') || upper.includes('EBIKE'))
        return 'EBike Mixto';
    // 3. Fallbacks para Master (por si vienen con espacios raros o sin la palabra Damas al principio)
    if (upper.includes('MASTER A'))
        return upper.includes('DAMAS') ? 'Damas Master A' : 'Master A';
    if (upper.includes('MASTER B'))
        return upper.includes('DAMAS') ? 'Damas Master B' : 'Master B';
    if (upper.includes('MASTER C'))
        return upper.includes('DAMAS') ? 'Damas Master C' : 'Master C';
    if (upper.includes('MASTER D'))
        return upper.includes('DAMAS') ? 'Damas Master D' : 'Master D'; // Master D damas no existe, pero por si acaso.
    if (upper.includes('ELITE'))
        return 'Elite';
    // Si no se encuentra en las reglas anteriores, intentar capitalizar el string recibido.
    // Así evitamos tener "PRE MASTER MIXTO" suelto si llegara a pasar.
    return clean.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
};
exports.normalizeCategory = normalizeCategory;
/**
 * Normaliza teléfonos al formato chileno: +56 9 XXXX XXXX
 */
const formatChileanPhone = (phone) => {
    if (!phone)
        return '';
    // 1. Limpiar todo lo que no sea número
    let clean = phone.replace(/\D/g, '');
    // 2. Manejar prefijos
    if (clean.length === 8) {
        // Si solo tiene 8 dígitos (ej: 12345678), asumimos que falta el 9 y el 56
        clean = '569' + clean;
    }
    else if (clean.length === 9) {
        // Si tiene 9 dígitos (ej: 912345678), falta el 56
        clean = '56' + clean;
    }
    else if (clean.startsWith('0')) {
        // Si empieza por 0, quitarlo y re-procesar
        return (0, exports.formatChileanPhone)(clean.slice(1));
    }
    // 3. Si no tiene el largo esperado (11 dígitos para +569...), devolver limpio pero sin formato
    if (clean.length !== 11)
        return clean ? `+${clean}` : '';
    // 4. Aplicar formato: +56 9 1234 5678
    const country = clean.slice(0, 2);
    const prefix = clean.slice(2, 3);
    const part1 = clean.slice(3, 7);
    const part2 = clean.slice(7, 11);
    return `+${country} ${prefix} ${part1} ${part2}`;
};
exports.formatChileanPhone = formatChileanPhone;
const cleanInstagramHandle = (input) => {
    if (!input)
        return null;
    let handle = input.trim();
    // Si es una URL completa
    if (handle.includes('instagram.com/')) {
        // Tomar la parte después de instagram.com/
        const parts = handle.split('instagram.com/');
        const lastPart = parts[parts.length - 1];
        // Quitar parámetros (query strings) como ?igsh=...
        handle = lastPart.split('?')[0];
    }
    // Quitar slash final si existe
    if (handle.endsWith('/')) {
        handle = handle.slice(0, -1);
    }
    // Si después de todo queda algo como "reels/handle", intentar sacar solo el final
    const segments = handle.split('/');
    handle = segments[segments.length - 1];
    // Quitar el @ si lo pusieron al principio
    if (handle.startsWith('@')) {
        handle = handle.slice(1);
    }
    return handle || null;
};
exports.cleanInstagramHandle = cleanInstagramHandle;
const normalizeForMatch = (str) => {
    if (!str)
        return [];
    const noClub = str.split('(')[0];
    const cleaned = noClub.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9\s]/g, '');
    return cleaned.split(/\s+/).filter(t => t.length > 0);
};
exports.normalizeForMatch = normalizeForMatch;
const isNameCompatible = (nameA, nameB) => {
    const tokensA = (0, exports.normalizeForMatch)(nameA);
    const tokensB = (0, exports.normalizeForMatch)(nameB);
    if (tokensA.length === 0 || tokensB.length === 0)
        return false;
    const shorter = tokensA.length <= tokensB.length ? tokensA : tokensB;
    const longer = tokensA.length <= tokensB.length ? tokensB : tokensA;
    let longerIndex = 0;
    for (let i = 0; i < shorter.length; i++) {
        const tokenToFind = shorter[i];
        let found = false;
        for (let j = longerIndex; j < longer.length; j++) {
            if (longer[j] === tokenToFind) {
                found = true;
                longerIndex = j + 1;
                break;
            }
        }
        if (!found)
            return false;
    }
    return true;
};
exports.isNameCompatible = isNameCompatible;
