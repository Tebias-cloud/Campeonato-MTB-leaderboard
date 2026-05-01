const fs = require('fs');
const path = require('path');

const brainPath = 'C:\\Users\\esteb\\.gemini\\antigravity\\brain';
const outputDir = path.join(__dirname, '..', 'restored_data');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

function extractFromJson(text, sourceId) {
    if (!text) return;
    
    // Look for JSON arrays in the text
    const regex = /\[\s*{\s*"[^"]+":[\s\S]+?}\s*\]/g;
    let match;
    let count = 0;
    while ((match = regex.exec(text)) !== null) {
        const jsonStr = match[0];
        try {
            // Remove backslashes if it was escaped in a JSON string
            const cleaned = jsonStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            const data = JSON.parse(cleaned);
            if (Array.isArray(data) && data.length > 0) {
                const sample = data[0];
                if (sample.rider_id || sample.event_id || sample.points || sample.full_name || sample.bib) {
                    const filename = `restored_${sourceId}_${count}.json`;
                    fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(data, null, 2));
                    console.log(`  -> Extracted ${data.length} items to ${filename}`);
                    count++;
                }
            }
        } catch (e) {
            // Not valid JSON
        }
    }
}

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (item === 'overview.txt') {
            console.log(`Processing ${fullPath}...`);
            const conversationId = path.basename(path.dirname(path.dirname(path.dirname(fullPath))));
            const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
            lines.forEach((line, idx) => {
                if (!line.trim()) return;
                try {
                    const step = JSON.parse(line);
                    // Extract from content (responses/inputs)
                    if (step.content) extractFromJson(step.content, `${conversationId}_step${step.step_index}`);
                    // Extract from tool results
                    if (step.tool_calls) {
                        step.tool_calls.forEach(tc => {
                           if (tc.args) extractFromJson(JSON.stringify(tc.args), `${conversationId}_step${step.step_index}_args`);
                        });
                    }
                    if (step.tool_output) extractFromJson(step.tool_output, `${conversationId}_step${step.step_index}_out`);
                } catch (e) {}
            });
        }
    }
}

walk(brainPath);
console.log('Done.');
