const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // Wait a little extra just in case
  await new Promise(r => setTimeout(r, 2000));

  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('dom_dump.txt', bodyHTML);
  
  console.log("DOM DUMPED SUCCESSFULLY.");
  
  await browser.close();
})();
