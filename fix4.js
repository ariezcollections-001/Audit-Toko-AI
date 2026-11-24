const fs = require('fs');
let content = fs.readFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js', 'utf8');

// Add </button> after the first button's > 
// The first button ends with "                      >\\r\\n" on line 143
// We need to change it to "                      >\\r\\n                      </button>\\r\\n"

content = content.replace(
  "                      >\\r\\n                        \\r\\n                      className={`px-2 py-1 text-xs rounded border ${mode === 'perOrder' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}",
  "                      >\\r\\n                      </button>\\r\\n                      className={`px-2 py-1 text-xs rounded border ${mode === 'perOrder' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}"
);

// Add </button> after the second button's >
// The second button ends with "                      >\\r\\n" on line 148
content = content.replace(
  "                      >\\r\\n                        \\r\\n                      className={`px-2 py-1 text-xs rounded border ${mode === 'perUnit' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}",
  "                      >\\r\\n                      </button>\\r\\n                      className={`px-2 py-1 text-xs rounded border ${mode === 'perUnit' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}"
);

// Remove the orphaned </button> on line 138 and line 139
// These are: "                      </button>\\r\\n" and "                    </button>\\r\\n"
// But we need to be careful not to remove the ones we just added

fs.writeFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js', content);
console.log('Done part 4');