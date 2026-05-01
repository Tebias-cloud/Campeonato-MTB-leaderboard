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
    if (content.includes('category_played')) {
      console.log(`\n--- FOUND POTENTIAL DATA IN ${log} ---`);
      // Look for the JSON start
      const index = content.lastIndexOf('category_played');
      console.log('Context around last match:', content.substring(index - 500, index + 1000));
    }
  }
}
search();
