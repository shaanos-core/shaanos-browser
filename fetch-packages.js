// This script is not automatically executed.
// You need to run it manually (e.g., `node fetch-packages.js`)
// or add it as a `prebuild` step in your package.json.

const https = require('https');
const fs = require('fs');
const path = require('path');

const PACKAGES_URL = 'https://shaanos-packages-browser-json.pages.dev/packages.json';
const OUTPUT_DIR = path.join(__dirname, 'public');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'packages.json');

console.log(`Fetching package data from ${PACKAGES_URL}...`);

https.get(PACKAGES_URL, (res) => {
  let body = '';

  if (res.statusCode !== 200) {
    console.error(`Failed to fetch packages. Status code: ${res.statusCode}`);
    res.resume();
    return;
  }

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    try {
      // Ensure the output directory exists
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }
      fs.writeFileSync(OUTPUT_PATH, body);
      console.log(`Successfully saved package data to ${OUTPUT_PATH}`);
    } catch (e) {
      console.error('Failed to parse or write package data:', e);
    }
  });
}).on('error', (e) => {
  console.error(`Error fetching package data: ${e.message}`);
});
