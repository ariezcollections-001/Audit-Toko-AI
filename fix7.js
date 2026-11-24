const fs = require('fs');
let content = fs.readFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js', 'utf8');

// The current state has:
// Line 137-138: First <button> properly closed with </button>
// Line 139: Orphaned </button> that needs to be removed
// Line 140-: Second <button> missing its </button>
// Lines 142-143 and 147-148: button > but no content and no closing

// Step 1: Remove the orphaned </button> on line 139
// The orphaned one is "                      </button>" (with more spaces)
// The proper one is "                        </button>" (with fewer spaces, on line 138)

// Actually, looking at the JSON output:
// Line 138: "                        </button>\r" (has more leading spaces)
// Line 139: "                      </button>\r" (has fewer leading spaces)

// I need to remove line 139's closing tag and add proper closings

// Let me just rewrite the entire button section from line 135 to 150

// Find the section to replace: from "<td className=\"px-6 py-4 text-center\">" to "</div>"
// But that's too broad. Let me do targeted fixes.

// Step 1: Remove the orphaned </button> on line 139
// The pattern "                      </button>\r\n" needs to be removed between the two button sections

// Step 2: Add </button> after the second button's >
// Step 3: Add button labels "Per Order" and "Per Unit"

// Let me use a different approach - just fix the file by replacing the specific broken lines

// Find and remove the orphaned </button> between the two button groups
// The orphaned one has fewer leading spaces: "                      </button>"
const orphanedPattern = "                      </button>\r\n";
const goodPattern = "                        </button>\r\n";

// Remove the orphaned closing by replacing it with nothing (but we need to be careful)
// Actually, let me just rebuild the button section entirely

// The current broken section (lines 135-150):
// <td className="px-6 py-4 text-center">
//   <div className="flex items-center justify-center gap-1">
//                         <button
// </button>
//                       </button>
//                         <button
//                         <button
//                         className={`px-2 py-1 text-xs rounded border ${mode === 'perOrder' ? ...}
//                       >
//                       <button
//                         className={`px-2 py-1 text-xs rounded border ${mode === 'perUnit' ? ...}
//                       >
//                       </button>  <- this was added by the script, but in the wrong place
//                   </div>

// Let me just replace lines 135-150 with the correct content

// Extract the part before the button section
const before = content.substring(0, content.indexOf('                    <td className="px-6 py-4 text-center">'));
// Actually, this is getting too complicated. Let me just use the editor to make small targeted edits.

// Let me just add the </button> after line 148 (the second button's >)
// And remove the orphaned </button> on line 139

// First, remove the orphaned </button> on line 139
// The line is "                      </button>\r" - I need to remove it
// But the editor works with old_text/new_text matching...

// Let me try using the insert_line function to add </button> after line 148
// And then use some other method to remove the orphaned tag

// Actually, let me just rewrite the whole file using Node.js fs operations

// Get the current content and rebuild the button section
const lines = content.split('\r\n');
 // Rebuild lines 135-150 with correct content

// The correct button section should be:
//                   <td className="px-6 py-4 text-center">
//                     <div className="flex items-center justify-center gap-1">
//                       <button
//                         className={`px-2 py-1 text-xs rounded border ${mode === 'perOrder' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
//                       >
//                         Per Order
//                       </button>
//                       <button
//                         className={`px-2 py-1 text-xs rounded border ${mode === 'perUnit' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
//                       >
//                         Per Unit
//                       </button>
//                     </div>
//                   </td>

let newContent = '';
let linesProcessed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (i >= 134 && i <= 150) {
    // Replace lines 135-150 (0-indexed: 134-149)
    linesProcessed++;
    continue; // Skip these lines, we'll add the correct ones
  }
  newContent += line + '\r\n';
}

// Now insert the correct button section at the right position
// The button section should go after line 134 (which is the </div> closing the gap-1 div)
// Actually, let me find the right position

// The structure is:
// ... line 134: some content
// then the button td section (lines 135-150)
// then line 151: {/* Kolom 7 ... */

// Let me just insert the correct button HTML after line 134 (which is the gap-1 div end)

// Actually this is getting too complicated. Let me just write the entire correct file.

console.log('Rebuilding file...');