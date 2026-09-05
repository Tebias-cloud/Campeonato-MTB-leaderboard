const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const stats = { matches: [], suspects: [] };

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[MATCH]')) stats.matches.push(text);
    if (text.includes('[WARNING] DORSAL SOSPECHOSO')) stats.suspects.push(text);
  });

  console.log("Navigating to local UI...");
  await page.goto('http://localhost:3000/admin/results', { waitUntil: 'networkidle2' });
  
  console.log("Clicking IMPORTAR to open modal...");
  // Find the button with text IMPORTAR
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const imp = btns.find(b => b.textContent.includes('IMPORTAR'));
    if (imp) imp.click();
  });

  // Wait for modal to render
  await new Promise(r => setTimeout(r, 1000));

  console.log("Uploading file...");
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.evaluate(() => document.querySelector('input[type=file]').click())
  ]);
  await fileChooser.accept(['C:/Users/esteb/Downloads/Results.pdf']);
  
  console.log("Waiting for processing (10s)...");
  await new Promise(r => setTimeout(r, 10000));
  
  console.log("Extracting results from UI...");
  const uiStats = await page.evaluate(() => {
    // Look for text like "XX LISTOS" and "YY SIN VINCULAR"
    const divs = Array.from(document.querySelectorAll('div'));
    let listos = -1;
    let sospechosos = -1;
    for (const div of divs) {
      if (div.textContent.includes('LISTO')) {
        const match = div.textContent.match(/(\d+)\s+LISTO/i);
        if (match) listos = parseInt(match[1]);
      }
      if (div.textContent.includes('SIN VINCULAR')) {
        const match = div.textContent.match(/(\d+)\s+SIN VINCULAR/i);
        if (match) sospechosos = parseInt(match[1]);
      }
    }
    return { listos, sospechosos };
  });

  console.log("\\n=== LOCAL UI REPORT ===");
  console.log("UI LISTOS:", uiStats.listos);
  console.log("UI SIN VINCULAR:", uiStats.suspects);
  console.log("Console Matches (total):", stats.matches.length);
  console.log("Console Suspects (total):", stats.suspects.length);
  
  await browser.close();
})();
