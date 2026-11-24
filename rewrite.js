const fs = require('fs');
const filePath = 'c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js';

let content = fs.readFileSync(filePath, 'utf8');

// The correct button section (with onClick handlers and proper escaping for output)
const correctButtonSection = `<td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onPackingModeChange(p.id, 'perOrder')}
                        className={\`px-2 py-1 text-xs rounded border \${packingMode[p.id] === 'perOrder' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}\`}
                      >
                        Per Order
                      </button>
                      <button
                        onClick={() => onPackingModeChange(p.id, 'perUnit')}
                        className={\`px-2 py-1 text-xs rounded border \${packingMode[p.id] === 'perUnit' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}\`}
                      >
                        Per Unit
                      </button>
                    </div>
                  </td>`;

// Regex to match the existing button section (from opening <td> to closing </td>)
const buttonRegex = /<td className="px-6 py-4 text-center">\s*<div className="flex items-center justify-center gap-1">[\s\S]*?<\/button>\s*<\/div>\s*<\/td>/;

const newContent = content.replace(buttonRegex, correctButtonSection);

if (newContent === content) {
  console.log('No changes made — button section not found or already correct.');
} else {
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Done — button section replaced.');
}