const fs = require('fs');
const c = fs.readFileSync('app/lib/analysis.js','utf8');
const lines = c.split(/\r?\n/);
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('_isSummaryRow') || lines[i].includes('break') && lines[i].includes('summary')) {
    console.log('LINE '+(i+1)+': '+lines[i]);
  }
}
