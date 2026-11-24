const fs = require('fs');
let content = fs.readFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js', 'utf8');

// Replace the malformed button section
// Original problematic section:
// <button
// className={`px-2 py-1 text-xs rounded border ${mode === 'perOrder' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}}
// >
// <button
// className={`px-2 py-1 text-xs rounded border ${mode === 'perUnit' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}}
// >

// Replace with properly closed buttons:
content = content.replace(
  "<button\n                        className={`px-2 py-1 text-xs rounded border ${mode === 'perOrder' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}\n                      >\n                      <button",
  "<button\n                        className={`px-2 py-1 text-xs rounded border ${mode === 'perOrder' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}\n                      >\n                      Per Order\n                      </button>\n                      <button"
);

content = content.replace(
  "className={`px-2 py-1 text-xs rounded border ${mode === 'perUnit' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}\n                      >\n                        <button",
  "className={`px-2 py-1 text-xs rounded border ${mode === 'perUnit' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}\n                      >\n                        Per Unit\n                      </button>"
);

fs.writeFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js', content);
console.log('Done');