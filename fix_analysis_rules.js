const fs = require('fs');
const p = 'app/lib/analysis.js';
let content = fs.readFileSync(p, 'utf8');

// ============================================================================
// EDIT A: smartMapHeaders — kunci pemetaan status ke Order status (bukan Type)
// Sisipkan sebelum 'return { mapping, headers, requiredColumnConfidence }'
// ============================================================================
const insertStatusLock = `
  // ============================================================================
  // KUNCI PEMETAAN status untuk TikTok Shop (Universal)
  // Pastikan 'status' selalu memetakan ke 'Order status' / 'Status Pesanan',
  // bukan ke 'Type'. Jika keduanya ada di header, 'status' = Order status,
  // dan 'Type' dipetakan terpisah sebagai 'transactionType' untuk deteksi
  // baris non-produk (Logistics adjustment).
  // ============================================================================
  const _hasOrderStatusCol = headers.some(h => {
    const nh = normalizeHeader(h)
    return nh === 'order status' || nh === 'status pesanan' || nh === 'status order'
  })
  const _hasTypeCol = headers.some(h => {
    const nh = normalizeHeader(h)
    return nh === 'type' || nh === 'transaction type' || nh === 'order type'
  })
  if (_hasOrderStatusCol && _hasTypeCol) {
    const _orderStatusCol = headers.find(h => {
      const nh = normalizeHeader(h)
      return nh === 'order status' || nh === 'status pesanan' || nh === 'status order'
    })
    const _typeCol = headers.find(h => {
      const nh = normalizeHeader(h)
      return nh === 'type' || nh === 'transaction type' || nh === 'order type'
    })
    // Jika status saat ini menunjuk ke Type, ganti ke Order status
    if (mapping.status && _typeCol && String(mapping.status).trim().toLowerCase() === String(_typeCol).trim().toLowerCase()) {
      mapping.status = _orderStatusCol
    }
    // Map Type sebagai transactionType untuk deteksi baris non-produk
    if (_typeCol && !mapping.transactionType) {
      mapping.transactionType = _typeCol
    }
  }

  return { mapping, headers, requiredColumnConfidence }
`;

const markerReturn = `  return { mapping, headers, requiredColumnConfidence }
}`;
if (!content.includes(markerReturn)) {
  console.log('EDIT A FAIL: marker return not found');
  process.exit(1);
}
content = content.replace(markerReturn, insertStatusLock);
console.log('EDIT A OK: status lock added to smartMapHeaders');

// ============================================================================
// EDIT B: Loop baris — break saat menemukan baris Total / Grand Total /
// Settlement Report Summary di bawah tabel utama
// Sisipkan setelah 'const row = rows[rowIdx]'
// ============================================================================
const markerRow = `    const row = rows[rowIdx]
    const orderId = getStr(row, 'orderId', ['No. Pesanan', 'order id', 'invoice'])`;
const insertRowBreak = `    const row = rows[rowIdx]

    // Hentikan loop pembacaan baris saat menemukan baris Total / Grand Total /
    // Settlement Report Summary (blok ringkasan di bawah tabel utama)
    const _rowVals = Object.values(row)
    const _firstNonEmpty = _rowVals.find(v => String(v || '').trim() !== '')
    const _firstCellStr = String(_firstNonEmpty || '').trim().toUpperCase()
    const _isSummaryRow = /^TOTAL|^GRAND TOTAL|^SETTLEMENT REPORT SUMMARY|^RINGKASAN/i.test(_firstCellStr)
    if (_isSummaryRow) break

    const orderId = getStr(row, 'orderId', ['No. Pesanan', 'order id', 'invoice'])`;
if (!content.includes(markerRow)) {
  console.log('EDIT B FAIL: marker row not found');
  process.exit(1);
}
content = content.replace(markerRow, insertRowBreak);
console.log('EDIT B OK: break on summary row added');

// ============================================================================
// EDIT C: Deteksi Type (adjustment) harus menggunakan transactionType, bukan status
// ============================================================================
const markerType = `      const typeRaw = getStr(row, 'status', ['Type', 'type', 'order type', 'transaction type', 'jenis transaksi', 'jenis pesanan']) || ''`;
const insertType = `      const typeRaw = getStr(row, 'transactionType', ['Type', 'type', 'order type', 'transaction type', 'jenis transaksi', 'jenis pesanan']) || ''`;
if (!content.includes(markerType)) {
  console.log('EDIT C FAIL: marker typeRaw not found');
  process.exit(1);
}
content = content.replace(markerType, insertType);
console.log('EDIT C OK: typeRaw uses transactionType');

fs.writeFileSync(p, content);
console.log('Selesai semua edit aturan universal');
