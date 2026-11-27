const fs = require('fs');
const path = 'c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/UploadSection.js';
let c = fs.readFileSync(path, 'utf8');

// Hapus onClick pada input file
const oldOnClick = `                  <input
                    ref={fileInputRef}
                    id="uploadFileInput"
                    type="file"
                    accept=".xlsx,.csv"
                    className="file-input-hidden"
                    onClick={(e) => {
                      e.target.value = ''
                    }}
                    onChange={handleFile}
                  />`;

const newInput = `                  <input
                    ref={fileInputRef}
                    id="uploadFileInput"
                    type="file"
                    accept=".xlsx,.csv"
                    className="file-input-hidden"
                    onChange={handleFile}
                  />`;

if (c.includes(oldOnClick)) {
  c = c.replace(oldOnClick, newInput);
  console.log('Removed onClick from file input');
} else {
  console.log('onClick pattern not found exactly');
  // Coba cari dengan regex lebih longgar
  const regex = /onClick=\{\(e\) => \{\s*e\.target\.value = ''\s*\}\s*\}\s*onChange=\{handleFile\}/;
  if (regex.test(c)) {
    c = c.replace(regex, 'onChange={handleFile}');
    console.log('Removed onClick via regex');
  } else {
    console.log('Regex also failed');
  }
}

// Tambahkan setIsProcessing ke handleDrop
const oldHandleDrop = `  const handleDrop = async (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) await processFile(file)
  }`;

const newHandleDrop = `  const handleDrop = async (e) => {
    e.preventDefault()
    setDragActive(false)
    setIsProcessing(true)
    setError(null)
    const file = e.dataTransfer.files[0]
    if (file) {
      await processFile(file)
      setIsProcessing(false)
    } else {
      setIsProcessing(false)
    }
  }`;

if (c.includes(oldHandleDrop)) {
  c = c.replace(oldHandleDrop, newHandleDrop);
  console.log('Updated handleDrop with setIsProcessing');
} else {
  console.log('handleDrop pattern not found');
}

fs.writeFileSync(path, c);
console.log('Done');
