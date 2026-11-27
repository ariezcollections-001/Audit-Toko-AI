const fs = require('fs');
const path = 'c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/page.js';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
// Line 631 is index 630 (0-based). Verify it's just '}'
console.log('Line 631:', JSON.stringify(lines[630]));
// Remove index 630 if it is exactly '}' (ignoring \r)
if (lines[630].replace(/\r/g, '') === '}') {
  lines.splice(630, 1);
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Removed stray } at line 631');
} else {
  console.log('Line 630 is not exactly }, aborting');
}
