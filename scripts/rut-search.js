const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\esteb\\.gemini\\antigravity\\brain';

function walk(dir) {
  let results = [];
  try {
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
  } catch (e) {}
  return results;
}

async function search() {
  const logs = walk(brainDir);
  console.log(`Searching through ${logs.length} logs for RUT 13412713-9...`);
  
  for (const log of logs) {
    try {
      const content = fs.readFileSync(log, 'utf8');
      if (content.includes('13412713-9')) {
        console.log(`\n--- FOUND RUT IN ${log} ---`);
        const index = content.indexOf('13412713-9');
        console.log('Context:', content.substring(index - 1000, index + 1000));
      }
    } catch (e) {}
  }
}
search();
