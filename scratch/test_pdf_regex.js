
const RIDER_REGEX = new RegExp("(?:(\\d+)\\s+)?(\\d+)\\s+([A-ZÁÉÍÓÚÑ\\s()\\.#&\\/-]{3,})\\s+(\\d{1,2}:[\\d:.]+|DQ)", "gi");

const sampleLines = [
    "1 123 JUAN PEREZ 01:23:45",
    "2 456 MARIA GARCIA 01:24:10",
    "3 789 JOSE LUIS GONZALEZ 01:25:00",
    "101 PEDRO RODRIGUEZ 01:26:00", // No position
    "5 202 ALBERTO (EL RAPIDO) 01:27:00",
    "6 303 LUIS A. MUÑOZ 01:28:00",
    "7 404 ANA MARIA DEL RIO 01:29:00",
    "8 505 ROBERTO DQ",
    "1 2026 EVENTO ANUAL 01:00:00", // Should be ignored by logic (dorsal starts with 20)
];

sampleLines.forEach(line => {
    console.log(`Testing line: "${line}"`);
    const matches = Array.from(line.matchAll(RIDER_REGEX));
    if (matches.length === 0) {
        console.log("  No matches found.");
    } else {
        matches.forEach(match => {
            console.log(`  Match: Pos=${match[1] || '-'}, Dorsal=${match[2]}, Name=${match[3]}, Time=${match[4]}`);
        });
    }
});
