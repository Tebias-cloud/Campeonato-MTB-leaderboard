const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\esteb\\.gemini\\antigravity\\brain\\80770231-ba80-41c8-bbd2-13d5cc673fc4\\.system_generated\\logs\\overview.txt';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

lines.forEach(line => {
    if (!line.trim()) return;
    try {
        const step = JSON.parse(line);
        if (step.tool_output) {
            const out = step.tool_output;
            if (out.includes('rider_id') || out.includes('points') || out.includes('position')) {
                console.log(`--- TOOL OUTPUT STEP ${step.step_index} ---`);
                console.log(out.substring(0, 5000)); // Print a good chunk
            }
        }
    } catch (e) {}
});
