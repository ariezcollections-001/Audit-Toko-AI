const fs = require('fs');
const path = 'c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/UploadSection.js';
let c = fs.readFileSync(path, 'utf8');

// 1. Hapus onClick pada input file yang mengosongkan nilai sebelum handleFile baca
const oldOnClick = `onClick={(e) => {\n                      e.target.value = ''\n                    }}\n                    onChange={handleFile}`;
const newOnClick = `onChange={handleFile}`;
if (c.includes(oldOnClick)) {
  c = c.replace(oldOnClick, newOnClick);
  console.log('Removed onClick from file input');
} else {
  console.log('onClick pattern not found, trying alternative...');
  // Coba cari variasi
  if (c.includes('onChange={handleFile}')) {
    console.log('onChange={handleFile} found but onClick pattern differs');
  }
}

// 2. Pastikan isProcessing di-reset di blok catch
const oldCatch = `      setError(err.message || NON_EXCEL_WARNING_MESSAGE)\n    }`;
const newCatch = `      setError(err.message || NON_EXCEL_WARNING_MESSAGE)
      setIsProcessing(false)
    }`;
if (c.includes(oldCatch)) {
  c = c.replace(oldCatch, newCatch);
  console.log('Added setIsProcessing(false) in catch block');
} else {
  console.log('Catch pattern not found');
}

fs.writeFileSync(path, c);
console.log('Done');
