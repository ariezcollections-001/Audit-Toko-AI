const fs = require('fs');
let content = fs.readFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js', 'utf8');

// Remove orphaned </button> tags that are on wrong lines
// Line 138 has "></button>" and line 139 has "                      </button>"
// We need to remove these and add proper </button> after each button's >

// Add </button> after first button's className (after the > on line 143)
// The pattern: "                      >\\n                        \\n                        className" should become "                      >\\n                      </button>\\n                        \\n                        className"

// Add </button> after second button's className

// First, let's replace the specific patterns
content = content.replace("                      >\\r\\n                        \\r\\n                        className", "                      >\\r\\n                    </button>\\r\\n                      className");
content = content.replace("                      >\\r\\n                        \\r\\n                      className", "                      >\\r\\n                    </button>\\r\\n                      className");

fs.writeFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js', content);
console.log('Done part 2');