const fs = require('fs');
const lines = fs.readFileSync('app/lib/analysis.js','utf8').split(/\r?\n/);
const start = parseInt(process.argv[2]||'1')-1;
const end = parseInt(process.argv[3]||lines.length);
for (let i=start; i<Math.min(end, lines.length); i++) {
  console.log((i+1).toString().padStart(4)+' | '+lines[i]);
}
