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
check('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/UploadSection.js');

const c = fs.readFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/UploadSection.js', 'utf8');
console.log('Has onClick on input:', c.includes('onClick={(e) =>'));
console.log('Has setIsProcessing in catch:', c.includes('setIsProcessing(false)\n    }'));
console.log('Has setIsProcessing in handleDrop:', c.includes('setIsProcessing(true)\n    setError(null)\n    const file = e.dataTransfer.files[0]'));
console.log('Has mount reset useEffect:', c.includes('Reset semua state upload saat komponen mount/refresh'));
