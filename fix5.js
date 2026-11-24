const fs = require('fs');
let content = fs.readFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js', 'utf8');

// The file has \r\n line endings. Let me add </button> after each button's > 
// First button: after "                      >\\r\\n" on line 143, add "                      </button>\\r\\n"
// Second button: after "                      >\\r\\n" on line 148, add "                      </button>\\r\\n"

// Replace the first button's closing
// Current: "                      >\\r\\n                        \\r\\n                      className..."
// Target: "                      >\\r\\n                      </button>\\r\\n                        \\r\\n                      className..."

// Let me try matching the exact pattern around the buttons
// Look for the pattern after the first button's className
const pattern1 = "                      >\\r\\n                        \\r\\n                      className={`px-2 py-1 text-xs rounded border ${mode === 'perOrder' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}";
const replacement1 = "                      >\\r\\n                      </button>\\r\\n                        \\r\\n                      className={`px-2 py-1 text-xs rounded border ${mode === 'perOrder' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}";

if (content.includes(pattern1)) {
  content = content.replace(pattern1, replacement1);
  console.log('Pattern 1 matched');
} else {
  console.log('Pattern 1 NOT matched');
  // Try without the backtick escape issues
  console.log('Looking for partial pattern...');
}

// Look for the pattern after the second button's className
const pattern2 = "                      >\\r\\n                        \\r\\n                      className={`px-2 py-1 text-xs rounded border ${mode === 'perUnit' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}";
const replacement2 = "                      >\\r\\n                      </button>\\r\\n                        \\r\\n                      className={`px-2 py-1 text-xs rounded border ${mode === 'perUnit' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}";

if (content.includes(pattern2)) {
  content = content.replace(pattern2, replacement2);
  console.log('Pattern 2 matched');
} else {
  console.log('Pattern 2 NOT matched');
}

fs.writeFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js', content);
console.log('Done');