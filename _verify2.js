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
check('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/admin/page.js');

// Tampilkan baris kunci
const lines = fs.readFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/page.js', 'utf8').split('\n');
console.log('\n--- page.js view state ---');
console.log(lines[19]); console.log(lines[20]); console.log(lines[21]); console.log(lines[22]);
console.log(lines[23]); console.log(lines[24]); console.log(lines[25]); console.log(lines[26]);
console.log(lines[27]); console.log(lines[28]); console.log(lines[29]); console.log(lines[30]);
console.log(lines[31]);

const lines2 = fs.readFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/admin/page.js', 'utf8').split('\n');
console.log('\n--- admin page auth state ---');
console.log(lines2[648]); console.log(lines2[649]); console.log(lines2[650]); console.log(lines2[651]);
console.log(lines2[652]); console.log(lines2[653]); console.log(lines2[654]); console.log(lines2[655]);
