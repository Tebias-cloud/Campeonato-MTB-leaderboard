const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\esteb\\.gemini\\antigravity\\brain\\80770231-ba80-41c8-bbd2-13d5cc673fc4\\.system_generated\\logs\\overview.txt';
const content = fs.readFileSync(logPath, 'utf8');

// The table pattern: | Pos | Corredor | Puntos |
const tableRegex = /\|\s*Pos\s*\|\s*Corredor\s*\|\s*Puntos\s*\|[\s\S]+?\n\n/g;
const matches = content.match(tableRegex);

if (matches) {
    console.log(`Found ${matches.length} tables.`);
    matches.forEach((table, i) => {
        console.log(`--- Table ${i} ---`);
        console.log(table);
    });
} else {
    console.log('No tables found with that pattern.');
    // Try a more generic pattern
    const genericRegex = /\|[^|]+\|[^|]+\|[^|]+\|/g;
    const genericMatches = content.match(genericRegex);
    if (genericMatches) {
        console.log(`Found ${genericMatches.length} generic table rows.`);
        console.log(genericMatches.slice(0, 20).join('\n'));
    }
}
