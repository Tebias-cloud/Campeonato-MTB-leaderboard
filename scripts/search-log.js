const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\esteb\\.gemini\\antigravity\\brain\\80770231-ba80-41c8-bbd2-13d5cc673fc4\\.system_generated\\logs\\overview.txt';

async function search() {
  if (!fs.existsSync(logPath)) {
    console.error('Log not found at', logPath);
    return;
  }
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log(`Searching through ${lines.length} lines...`);
  
  const results = lines.filter(l => l.includes('04772623-90d4-4bc7-b98f-6f4f79386330') && l.includes('position'));
  
  console.log(`Found ${results.length} lines with potential results.`);
  results.forEach((l, i) => {
    console.log(`Match ${i}:`, l.substring(0, 500));
  });
}
search();
