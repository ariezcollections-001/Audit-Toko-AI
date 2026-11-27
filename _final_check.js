const fs = require('fs');
function check(path) {
  const c = fs.readFileSync(path, 'utf8');
  let depth = 0, inStr = false, strChar = null, inLC = false, inBC = false;
  for (let i = 0; i < c.length; i++) {
    const ch = c[i], nxt = c[i + 1];
    if (inLC) { if (ch === '\n') inLC = false; continue; }
    if (inBC) { if (ch === '*' && nxt === '/') { inBC = false; i++; } continue; }
    if (inStr) { if (ch === '\\') { i++; continue; } if (ch === strChar) inStr = false; continue; }
    if (ch === '/' && nxt === '/') { inLC = true; i++; continue; }
    if (ch === '/' && nxt === '*') { inBC = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strChar = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}') depth--;
  }
  console.log(path, '| brace depth:', depth);
}
check('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/page.js');
check('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/ResultsSection.js');
check('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/Footer.js');

// Tampilkan baris kunci page.js
const lines = fs.readFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/page.js', 'utf8').split('\n');
console.log('\n--- page.js scroll-to-top ---');
console.log(lines[90]); console.log(lines[91]); console.log(lines[92]); console.log(lines[93]);
console.log(lines[94]); console.log(lines[95]); console.log(lines[96]); console.log(lines[97]);
console.log(lines[98]); console.log(lines[99]); console.log(lines[100]); console.log(lines[101]);
console.log('\n--- page.js main results ---');
console.log(lines[704]); console.log(lines[705]);

// Tampilkan baris kunci ResultsSection.js
const lines2 = fs.readFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/ResultsSection.js', 'utf8').split('\n');
console.log('\n--- ResultsSection.js tombol kembali ---');
console.log(lines2[342]); console.log(lines2[343]); console.log(lines2[344]); console.log(lines2[345]);
