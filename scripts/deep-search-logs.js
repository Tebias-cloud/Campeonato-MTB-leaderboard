const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\esteb\\.gemini\\antigravity\\brain';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('overview.txt')) results.push(file);
    }
  });
  return results;
}

async function search() {
  const logs = walk(brainDir);
  console.log(`Searching through ${logs.length} logs...`);
  
  for (const log of logs) {
    const content = fs.readFileSync(log, 'utf8');
    if (content.includes('position') && content.includes('rider_id')) {
      console.log(`\n--- FOUND POTENTIAL DATA IN ${log} ---`);
      // Find JSON arrays
      const regex = /\[\s*{\s*"id":\s*"[^"]*",\s*"event_id":\s*"04772623-90d4-4bc7-b98f-6f4f79386330"/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
          console.log('Found result dump at index', match.index);
          console.log(content.substring(match.index, match.index + 2000));
      }
    }
  }
}
search();
