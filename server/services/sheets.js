const https = require('https');

function parseSheetUrl(url) {
  // Supports both /edit and /pub URLs
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error('Invalid Google Sheets URL');
  return match[1];
}

function fetchCsvFromSheet(url) {
  const sheetId = parseSheetUrl(url);
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

  return new Promise((resolve, reject) => {
    function follow(target) {
      const mod = target.startsWith('https') ? require('https') : require('http');
      mod.get(target, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          res.resume(); // drain so socket is released
          return follow(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      }).on('error', reject);
    }
    follow(csvUrl);
  });
}

function parseCsv(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  // Detect header row — if first row looks like "name,phone" skip it
  const header = lines[0].toLowerCase();
  const startIdx = header.includes('name') || header.includes('phone') ? 1 : 0;

  return lines.slice(startIdx).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const name = cols[0] || '';
    let phone = (cols[1] || '').replace(/\s+/g, '').replace(/^0/, '60');
    // Strip non-digits except leading +
    phone = phone.replace(/[^\d+]/g, '');
    return { name, phone };
  }).filter((r) => r.name && r.phone);
}

async function loadContactsFromSheet(url) {
  const csv = await fetchCsvFromSheet(url);
  return parseCsv(csv);
}

module.exports = { loadContactsFromSheet };
