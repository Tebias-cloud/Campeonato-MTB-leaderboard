const fs = require('fs');
const path = require('path');

const brainPath = 'C:\\Users\\esteb\\.gemini\\antigravity\\brain';

function searchLogs(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchLogs(fullPath);
        } else if (file === 'overview.txt') {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Buscamos patrones de resultados: rider_id, event_id, position, points
            if (content.includes('rider_id') && content.includes('event_id') && content.includes('position')) {
                console.log(`\n=== POSIBLE DATA ENCONTRADA EN: ${fullPath} ===`);
                
                // Intentar extraer bloques JSON que parezcan resultados
                const regex = /\[\s*{\s*"id":\s*"[^"]+",\s*"event_id":\s*"04772623-90d4-4bc7-b98f-6f4f79386330"/g;
                let match;
                while ((match = regex.exec(content)) !== null) {
                    console.log('--- BLOQUE DETECTADO ---');
                    console.log(content.substring(match.index, match.index + 2000));
                }
                
                // Si no hay match con el ID de la fecha 1, buscar cualquier array de resultados
                if (!content.includes('04772623-90d4-4bc7-b98f-6f4f79386330')) {
                    const genericRegex = /"rider_id":\s*"[^"]+",\s*"position":\s*\d+/g;
                    const genericMatch = content.match(genericRegex);
                    if (genericMatch) {
                        console.log(`Encontrados ${genericMatch.length} registros individuales de resultados.`);
                        // Mostrar los primeros 5 para verificar
                        console.log('Muestra:', genericMatch.slice(0, 5));
                    }
                }
            }
        }
    }
}

try {
    searchLogs(brainPath);
} catch (err) {
    console.error('Error durante la búsqueda:', err);
}
