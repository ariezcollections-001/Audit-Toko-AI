const fs = require('fs');
let content = fs.readFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js', 'utf8');

// Find the positions of the two button className patterns
const classNamePattern = 'className={`px-2 py-1 text-xs rounded border';
const idx1 = content.indexOf(classNamePattern);
console.log('First className at index:', idx1);

// The first button's className is followed by }\r\n
// After the second button's className is followed by }\r\n

// Let me find where each button's > is
// First button > should be after its className
// Second button > should be after its className

// Let me just insert </button> at the right positions by finding the patterns

// After first button's className, the next occurrence of ">" should be the button's >
// After second button's className, similarly

// Let me try a different approach: just add </button> tags right after the 
// button opening tags by matching the <button\n pattern and adding the closing

// Actually, let me just use the known indices to fix the file
// The first <button is at around index where "                        <button" appears
// Let me find <button patterns

const buttonOpen1 = content.indexOf('                        <button');
const buttonOpen2 = content.indexOf('                      <button', buttonOpen1 + 1);
console.log('First <button at index:', buttonOpen1);
console.log('Second <button at index:', buttonOpen2);

// Find the corresponding > for each button
// The > should be on the next line after the className

// Let me try a completely different approach: just use regex to find <button tags without </button> and add closing tags

// Actually, the simplest fix: just ensure every <button has a </button>
// Let me count the <button occurrences and ensure each has a matching </button>

const buttonOpens = content.match(/<button/gi);
const buttonCloses = content.match(/<\/button>/gi);
console.log('Button opens:', buttonOpens ? buttonOpens.length : 0);
console.log('Button closes:', buttonCloses ? buttonCloses.length : 0);

// If there are more opens than closes, add the missing ones
if (buttonOpens && buttonCloses) {
  const opens = buttonOpens.length;
  const closes = buttonCloses.length;
  if (opens > closes) {
    // Add missing closing tags before the last </div>
    const lastDiv = content.lastIndexOf('</div>');
    const insertPos = content.indexOf('>', lastDiv);
    if (insertPos > 0) {
      content = content.slice(0, insertPos) + '></button>' + content.slice(insertPos);
      console.log('Added missing </button>');
    }
  }
}

fs.writeFileSync('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js', content);
console.log('Done');