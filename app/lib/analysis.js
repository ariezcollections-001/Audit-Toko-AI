import * as XLSX from 'xlsx'

/* ============================================================================
   SMART HEADER MAPPER - Multi-marketplace column recognition
   ============================================================================ */

const COLUMN_ALIASES = {
  orderId: [
    'order id', 'no. pesanan', 'nomer pesanan', 'nomor pesanan', 'orderid',
    'invoice', 'no invoice', 'order number', 'no order', 'pesanan id', 'id pesanan'
  ],
  productName: [
    'product name', 'nama produk', 'namaproduk', 'produk', 'item name',
    'nama item', 'product', 'nama barang', 'barang'
  ],
  sku: [
    'sku', 'kode produk', 'kodebarang', 'product sku', 'item sku',
    'kode barang', 'kode item'
  ],
  settlementAmount: [
    'settlement amount', 'total penghasilan', 'totalpendapatan',
    'pendapatan total', 'amount', 'total amount', 'gross amount',
    'net amount', 'total receive', 'total diterima', 'jumlah diterima',
    'net payout', 'pendapatan bersih', 'pendapatan netto', 'payout',
    'total payout', 'pendapatan akhir', 'saldo akhir',
    'estimasi total penghasilan', 'estimated total income', 'est total income'
  ],
  shippingFee: [
    'shipping fee', 'ongkir', 'biaya kirim', 'ongkos kirim',
    'biaya pengiriman', 'shipping', 'ongkos delivery', 'biaya ongkir',
    'subsidi ongkir', 'voucher ongkir', 'ongkir subsidi'
  ],
  platformCommission: [
    'platform commission', 'biaya administrasi', 'biaya admin',
    'admin fee', 'commission', 'platform fee', 'biaya platform',
    'biaya jasa', 'jasa penjualan', 'biaya layanan', 'biaya layanan termasuk ppn',
    'layanan', 'biaya service'
  ],
  affiliateCommission: [
    'affiliate commission', 'komisi afiliasi', 'affiliate fee',
    'biaya afiliasi'
  ],
  // --- Kolom potongan dari file Excel pelanggan ---
  productPrice: [
    'harga asli produk', 'product price', 'harga jual', 'price',
    'harga', 'unit price', 'harga satuan', 'harga produk'
  ],
  quantity: [
    'quantity', 'qty', 'jumlah', 'jumlah terjual', 'terjual',
    'jumlah produk', 'qty terjual'
  ],
  productWeight: [
    'product weight', 'berat produk', 'berat', 'weight',
    'berat barang', 'gram'
  ],
  shippingEstimate: [
    'estimasi ongkir', 'estimated shipping', 'shipping estimate',
    'estimated shipping cost', 'ongkir estimasi'
  ],
  buyerShipping: [
    'ongkir dibayar pembeli', 'buyer shipping', 'shipping paid by buyer',
    'ongkir pembeli'
  ],
  resi: [
    'resi', 'no resi', 'nomor resi', 'tracking number', 'tracking no',
    'nomor pengiriman', 'awb'
  ],
  voucher: [
    'voucher', 'voucher diskon', 'diskon voucher', 'potongan voucher',
    'kode voucher', 'promo', 'potongan promo'
  ],
  subsidi: [
    'subsidi', 'subsidi ongkir', 'subsidi biaya kirim', 'bantuan ongkir'
  ],
  // --- Alias Biaya Shopee Terbaru ---
  orderProcessFee: [
    'biaya proses pesanan', 'order process fee', 'biaya proses order'
  ],
  adjustmentFee: [
    'biaya penyesuaian', 'biaya penyesuaian pesanan', 'order adjustment',
    'penyesuaian', 'adjustment fee', 'biaya koreksi'
  ],
  sellerDiscount: [
    'diskon penjual', 'diskon seller', 'promo penjual'
  ],
  promoServiceFee: [
    'biaya layanan promo xtra', 'promo xtra service fee', 'biaya layanan promo',
    'biaya layanan xtra'
  ],
  // --- Kolom potongan Shopee baru ---
  platformFee: [
    'biaya platform', 'platform fee'
  ],
  freeShippingXtra: [
    'biaya gratis Ongkir XTRA', 'biaya gratis ongkir xtra', 'gratis ongoing xtra'
  ],
  serviceFee: [
    'biaya layanan', 'biaya jasa', 'service fee'
  ],
  promoFee: [
    'biaya promosi', 'biaya promo', 'promo fee'
  ],
  otherFee: [
    'biaya lainnya', 'biaya lain-lain', 'other fee'
  ],
  adminFee: [
    'biaya administrasi', 'biaya admin', 'admin fee'
  ],
  shippingDifference: [
    'selisih ongkir', 'selisih Ongkir', 'shipping difference'
  ],
  amsCommission: [
    'biaya komisi ams', 'ams commission', 'komisi ams'
  ],
  shippingSavingProgram: [
    'biaya program hemat biaya kirim', 'shipping saving program',
    'program hemat ongkir', 'hemat biaya kirim'
  ],
  refund: [
    'refund', 'pengembalian dana', 'nominal pengembalian dana', 'jumlah pengembalian dana',
    'pengembalian', 'biaya retur', 'retur', 'return', 'refund amount', 'total pengembalian'
  ],
  // --- Kolom biaya potongan dari file Excel pelanggan ---
  transactionFee: [
    'biaya transaksi', 'biaya transaksi resmi', 'fee transaksi'
  ],
  premium: [
    'premi', 'biaya premi', 'asuransi premi'
  ],
  tax: [
    'pajak', 'pph 22', 'pajak penghasilan', 'tax'
  ],
  additionalServiceFee: [
    'biaya layanan tambahan', 'additional service fee', 'biaya tambahan'
  ],
  estimatedTotalIncome: [
    'estimasi total penghasilan', 'estimated total income', 'est total income'
  ],
  shippingDeduction: [
    'potongan ongkos kirim dari shopee', 'shipping deduction', 'potongan ongkir shopee',
    'deduksi ongkir', 'ongkir ditanggung shopee'
  ],
  shippingPaidToCourier: [
    'ongkos kirim yang dibayarkan ke jasa kirim', 'shipping paid to courier',
    'biaya kirim ke kurir', 'ongkir dikurir'
  ]
}

function getColumnAliases() {
  return COLUMN_ALIASES
}

// Marketplace-specific column alias mappings (multi-marketplace support)
function getTikTokColumnAliases() {
  return {
    orderId: ['order id', 'order id tiktok', 'no order', 'order details id'],
    productName: ['product name', 'product name tiktok', 'nama produk', 'item name'],
    sku: ['sku', 'seller sku'],
    settlementAmount: ['settlement amount', 'total settlement', 'total pendapatan'],
    shippingFee: ['shipping fee', 'customer shipping fee', 'shipping fee tiktok'],
    platformCommission: ['platform commission', 'platform commission tiktok', 'fee tiktok'],
    affiliateCommission: ['affiliate commission', 'affiliate tiktok'],
    refund: ['refund', 'refund tiktok'],
    productPrice: ['product price', 'price', 'harga jual tiktok'],
    quantity: ['quantity', 'qty'],
    buyerShipping: ['buyer shipping', 'customer shipping fee'],
    resi: ['resi', 'tracking number', 'resi tiktok']
  }
}

function getTokopediaColumnAliases() {
  return {
    orderId: ['no invoice', 'nomor invoice', 'order number'],
    productName: ['nama produk', 'product name', 'produk tokopedia'],
    sku: ['nomor sku', 'sku toko'],
    settlementAmount: ['total pendapatan bersih', 'total pendapatan'],
    shippingFee: ['ongkir pembeli', 'ongkos kirim'],
    platformCommission: ['biaya komisi platform', 'biaya administrasi'],
    affiliateCommission: [],
    refund: ['dana dikembalikan'],
    productPrice: ['harga jual (rp)'],
    quantity: ['jumlah produk'],
    buyerShipping: ['ongkir pembeli'],
    resi: ['resi', 'tracking number']
  }
}

function getLazadaColumnAliases() {
  return {
    orderId: ['order number', 'order number lazada'],
    productName: ['item name', 'product name lazada'],
    sku: ['seller sku', 'seller sku lazada'],
    settlementAmount: ['payout amount', 'payout amount lazada'],
    shippingFee: ['shipping fee charged by lazada', 'shipping fee paid by customer'],
    platformCommission: ['commission fee', 'commission fee lazada'],
    affiliateCommission: [],
    refund: ['refund'],
    productPrice: ['paid price'],
    quantity: ['qty'],
    buyerShipping: ['shipping fee paid by customer'],
    resi: ['resi', 'tracking number', 'awb']
  }
}

const BUKALAPAK_COLUMN_ALIASES = {
  orderId: ['kode transaksi', 'kode transaksi bukalapak'],
  productName: ['nama barang', 'nama barang bukalapak'],
  sku: ['sku'],
  settlementAmount: ['total dana diterima'],
  shippingFee: ['ongkos kirim pembeli', 'ongkos kirim kurir'],
  platformCommission: ['biaya komisi bukalapak', 'biaya komisi'],
  affiliateCommission: [],
  refund: ['refund'],
  productPrice: ['harga barang'],
  quantity: ['jumlah'],
  buyerShipping: ['ongkos kirim pembeli'],
  resi: ['resi', 'tracking number']
}

const TIKTOK_COLUMN_ALIASES = getTikTokColumnAliases()
const TOKOPEDIA_COLUMN_ALIASES = getTokopediaColumnAliases()
const LAZADA_COLUMN_ALIASES = getLazadaColumnAliases()

const MARKETPLACE_ALIASES = {
  shopee: COLUMN_ALIASES,
  tiktok: TIKTOK_COLUMN_ALIASES,
  tokopedia: TOKOPEDIA_COLUMN_ALIASES,
  lazada: LAZADA_COLUMN_ALIASES,
  bukalapak: BUKALAPAK_COLUMN_ALIASES,
}

// Marketplace-specific column header names for example file download and lookup
const MARKETPLACE_COLUMNS = {
  shopee: [
    'No. Pesanan', 'Nama Produk', 'SKU', 'Jumlah Terjual',
    'Harga Asli Produk', 'Diskon Penjual', 'Biaya Administrasi',
    'Biaya Layanan Gratis Ongkir XTRA', 'Biaya Transaksi',
    'Ongkir Dibayar Pembeli', 'Estimasi Ongkir Jasa Kirim',
    'Pengembalian Dana', 'Total Penghasilan',
  ],
  tiktok: [
    'Order ID', 'Product Name', 'SKU', 'Quantity',
    'Settlement Amount', 'Shipping Fee', 'Platform Commission',
    'Affiliate Commission', 'Refund', 'Product Price',
    'Buyer Shipping', 'Resi',
  ],
  tokopedia: [
    'No Invoice', 'Nama Produk', 'SKU', 'Jumlah Terjual',
    'Harga Produk', 'Diskon', 'Biaya Administrasi',
    'Biaya Transaksi', 'Ongkir', 'Pengembalian',
    'Total Penghasilan', 'Resi',
  ],
  lazada: [
    'Order ID', 'Product Name', 'SKU', 'Quantity Sold',
    'Product Price', 'Seller Discount', 'Platform Fee',
    'Shipping Fee', 'Buyer Shipping', 'Refund',
    'Total Income', 'Tracking Number',
  ],
  bukalapak: [
    'Order ID', 'Product Name', 'SKU', 'Quantity',
    'Settlement Amount', 'Shipping Fee', 'Platform Commission',
    'Affiliate Commission', 'Refund', 'Product Price',
    'Buyer Shipping', 'Resi',
  ],
}

/**
 * Get column aliases for a specific marketplace
 */
/**
 * Get column aliases for a specific marketplace
 */
function getMarketplaceAliases(marketplace) {
  return MARKETPLACE_ALIASES[marketplace] || COLUMN_ALIASES
}


const COST_KEYWORDS = [
  'biaya', 'potongan', 'fee', 'commission', 'koreksi', 'adjustment',
  'penalty', 'denda', 'pokok', 'cogs', 'modal', 'dpp', 'ppn',
  'pajak', 'tarif', 'biaya layanan', 'biaya transaksi'
]

function normalizeHeader(h) {
  return String(h).trim().toLowerCase().replace(/[._\-/\\]/g, ' ')
}

function scoreMatch(header, alias) {
  if (header === alias) return 100
  if (header.includes(alias)) return 85
  if (alias.includes(header)) return 70
  const hWords = header.split(' ').filter(Boolean)
  const aWords = alias.split(' ').filter(Boolean)
  const overlap = hWords.filter(w => aWords.includes(w)).length
  if (overlap > 0) return 60 + overlap * 5
  return 0
}

export function smartMapHeaders(rawHeaders, marketplace = 'auto') {
  const headers = rawHeaders.map(h => String(h).trim())
  const normalized = headers.map(normalizeHeader)
  const mapping = {}
  const usedIndices = new Set()

  // Use marketplace-specific aliases if available; in 'auto' mode merge ALL
  // marketplace alias sets so any column from Shopee/TikTok/Tokopedia/Lazada/Bukalapak
  // is recognized regardless of which marketplace generated the file.
  let aliases
  if (marketplace !== 'auto') {
    aliases = getMarketplaceAliases(marketplace)
  } else {
    aliases = { ...COLUMN_ALIASES }
    for (const mp of ['shopee', 'tiktok', 'tokopedia', 'lazada', 'bukalapak']) {
      const mpAliases = getMarketplaceAliases(mp)
      for (const [key, list] of Object.entries(mpAliases)) {
        if (!aliases[key]) aliases[key] = []
        for (const a of list) {
          if (!aliases[key].includes(a)) aliases[key].push(a)
        }
      }
    }
  }

  for (const [key, alias] of Object.entries(aliases)) {
    let bestScore = 0
    let bestIdx = -1
    for (let i = 0; i < normalized.length; i++) {
      if (usedIndices.has(i)) continue
      for (const a of alias) {
        const score = scoreMatch(normalized[i], a)
        if (score > bestScore) {
          bestScore = score
          bestIdx = i
        }
      }
    }
    if (bestScore >= 50 && bestIdx >= 0) {
      mapping[key] = headers[bestIdx]
      usedIndices.add(bestIdx)
    }
  }

  // Add any remaining columns as cost columns if they contain numerical values
  for (let i = 0; i < normalized.length; i++) {
    if (usedIndices.has(i)) continue
    const header = normalized[i]
    const original = headers[i]
    // Check if it looks like a cost/price column
    if (/harga|harga jual|harga modal|ongkir|biaya|commission|fee|diskon|potongan|voucher|subsidi|payout|netto|bersih/i.test(header)) {
      mapping[`cost_${i}`] = original
      usedIndices.add(i)
    }
  }

  return { mapping, headers }
}

/* ============================================================================
   UNIVERSAL NUMBER PARSER - Anti-error format angka
   ============================================================================ */

/**
 * Parses virtually any number format into a clean Number.
 * Handles:
 *   - "Rp 150.000"       → 150000
 *   - "Rp150.000"        → 150000
 *   - "150.000"          → 150000
 *   - "150,000.00"       → 150000
 *   - "(15.000)"         → -15000   (accounting negative)
 *   - "-15000"           → -15000
 *   - "150000"           → 150000
 *   - null / undefined / "" → 0
 *   - Anything else      → 0 (never NaN)
 */
export function parseNumberUniversal(val) {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val

  const s = String(val).trim()
  if (s === '') return 0

  // Detect accounting-style negative: (15.000) → -15000
  let isNegative = /^\(\s*[\d.,]+\s*\)$/.test(s)

  // Remove all non-numeric chars except digits, comma, dot, minus
  let cleaned = s.replace(/[^0-9.,-]/g, '')

  // If accounting format detected, ensure negative sign
  if (isNegative && !cleaned.startsWith('-')) {
    cleaned = '-' + cleaned
  }

  // Indonesian format: "150.000" → thousand separator dot
  // US format: "150,000.00" → comma thousand, dot decimal
  // Strategy: remove dots (thousand sep), replace comma with dot (decimal)
  const hasDot = cleaned.includes('.')
  const hasComma = cleaned.includes(',')

  if (hasDot && hasComma) {
    // "1.234,56" (EU/ID) or "1,234.56" (US)
    // If last comma is after last dot → EU/ID: 1.234,56
    // If last dot is after last comma → US: 1,234.56
    const lastDot = cleaned.lastIndexOf('.')
    const lastComma = cleaned.lastIndexOf(',')
    if (lastComma > lastDot) {
      // EU/ID format: remove dots, replace comma with dot
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      // US format: remove commas, keep dot
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (hasDot && !hasComma) {
    // Could be "150.000" (ID thousand) or "150.00" (US decimal)
    // Heuristic: if dot is followed by exactly 2 digits at end → decimal
    // Otherwise → thousand separator, remove dots
    const parts = cleaned.split('.')
    if (parts.length === 2 && parts[1].length === 2 && parts[0].length <= 3) {
      // Likely decimal like "150.00"
      cleaned = parts.join('.')
    } else {
      // Thousand separator like "150.000" or "1.234.567"
      cleaned = cleaned.replace(/\./g, '')
    }
  } else if (hasComma && !hasDot) {
    // "150,000" → could be thousand (US) or decimal (EU)
    const parts = cleaned.split(',')
    if (parts.length === 2 && parts[1].length === 2) {
      // Decimal like "150,00"
      cleaned = parts.join('.')
    } else {
      // Thousand separator like "150,000"
      cleaned = cleaned.replace(/,/g, '')
    }
  }

  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

/**
 * Backward-compatible alias for existing callers
 */
function toNumber(val) {
  return parseNumberUniversal(val)
}

/* ============================================================================
   SMART HEADER ROW FINDER - Deteksi baris judul tabel otomatis
   ============================================================================ */

/**
 * Keywords yang menunjukkan baris adalah header tabel transaksi
 */
const HEADER_KEYWORDS = [
  'pesanan', 'order', 'invoice', 'produk', 'product', 'item',
  'harga', 'price', 'penghasilan', 'settlement', 'jumlah', 'qty',
  'sku', 'ongkir', 'commission', 'biaya', 'refund', 'retur',
  'resi', 'tracking', 'pembeli', 'buyer'
]

/**
 * Memindai baris pertama (maxRows) pada sheet untuk menemukan baris header
 * yang berisi kata kunci kolom transaksi. Mengembalikan index baris header
 * atau -1 jika tidak ditemukan.
 */
export function findHeaderRow(sheet, maxRows = 15) {
  if (!sheet || !sheet['!ref']) return -1

  const range = XLSX.utils.decode_range(sheet['!ref'])
  const endRow = Math.min(range.e.r, maxRows - 1)

  for (let r = range.s.r; r <= endRow; r++) {
    let keywordHits = 0
    let totalCells = 0

    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c })
      const cell = sheet[cellAddress]
      if (!cell) continue

      const val = String(cell.v !== undefined ? cell.v : cell.w || '').trim().toLowerCase()
      if (val === '') continue

      totalCells++
      for (const kw of HEADER_KEYWORDS) {
        if (val.includes(kw)) {
          keywordHits++
          break
        }
      }
    }

    // Jika lebih dari 30% sel pada baris ini mengandung keyword header
    if (totalCells >= 3 && keywordHits / totalCells >= 0.3) {
      return r
    }
  }

  return -1
}

/**
 * Membaca semua sheet dalam workbook dan mengembalikan data gabungan.
 * Sheet yang berisi 'Penyesuaian' atau 'Adjustment' akan ditangani secara khusus
 * untuk menambahkan data biaya penyesuaian ke dalam klaim.
 */
export function scanAllSheets(workbook) {
  const allRecords = []
  const allHeaders = new Set()
  const sheetInfo = []
  let adjustmentRows = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const headerRowIdx = findHeaderRow(sheet, 15)

    if (headerRowIdx === -1) {
      // Sheet tanpa header yang terdeteksi, skip atau coba baca sebagai adjustment
      const lowerName = sheetName.toLowerCase()
      if (lowerName.includes('penyesuaian') || lowerName.includes('adjustment')) {
        sheetInfo.push({ name: sheetName, type: 'adjustment', headerRow: -1 })
      }
      continue
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    if (rows.length <= headerRowIdx + 1) continue

    const headers = rows[headerRowIdx].map(h => String(h || '').trim())
    const records = rows.slice(headerRowIdx + 1).map(row => {
      const obj = {}
      headers.forEach((h, i) => {
        if (h !== '') obj[h] = row[i] !== undefined ? row[i] : ''
      })
      return obj
    }).filter(obj => Object.keys(obj).length > 0)

    headers.forEach(h => allHeaders.add(h))
    allRecords.push(...records)

    const lowerName = sheetName.toLowerCase()
    const isAdjustment = lowerName.includes('penyesuaian') || lowerName.includes('adjustment')
    sheetInfo.push({ name: sheetName, type: isAdjustment ? 'adjustment' : 'transaction', headerRow: headerRowIdx, recordCount: records.length })

    if (isAdjustment) {
      adjustmentRows.push(...records)
    }
  }

  return { allRecords, allHeaders: Array.from(allHeaders), sheetInfo, adjustmentRows }
}

/**
 * Validasi file sebelum diproses. Mengembalikan { valid, errorMessage }
 */
export function validateExcelFile(file) {
  if (!file) {
    return { valid: false, errorMessage: 'Tidak ada file yang dipilih.' }
  }

  const fileName = file.name.toLowerCase()
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')

  if (!isExcel) {
    return {
      valid: false,
      errorMessage: 'File ini bukan laporan rincian pesanan Excel (.xlsx/.csv). Silakan unduh file rincian berformat Excel dari menu Penghasilan / Keuangan Seller Center Anda.'
    }
  }

  return { valid: true, errorMessage: null }
}

/**
 * Warning message untuk file non-Excel
 */
export const NON_EXCEL_WARNING_MESSAGE = 'File ini bukan laporan rincian pesanan Excel (.xlsx/.csv). Silakan unduh file rincian berformat Excel dari menu Penghasilan / Keuangan Seller Center Anda.'

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    // Validasi file terlebih dahulu
    const validation = validateExcelFile(file)
    if (!validation.valid) {
      return reject(new Error(validation.errorMessage))
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          return reject(new Error('File Excel tidak mengandung sheet/tab apa pun.'))
        }

        // Scan semua sheet, bukan hanya sheet pertama
        const { allRecords, allHeaders, sheetInfo, adjustmentRows } = scanAllSheets(workbook)

        if (allRecords.length === 0) {
          return reject(new Error('Tidak ditemukan data transaksi pada sheet mana pun dalam file ini.'))
        }

        // Gunakan semua header yang ditemukan di seluruh sheet
        const headers = allHeaders

        resolve({
          headers,
          records: allRecords,
          sheetInfo,
          adjustmentRows,
          source: 'multi-sheet'
        })
      } catch (err) {
        reject(new Error('Gagal membaca file Excel: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file.'))
    reader.readAsArrayBuffer(file)
  })
}

export function parseHppFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })
        if (rows.length < 2) {
          return reject(new Error('File HPP tidak mengandung data.'))
        }
        const hppMap = {}
        rows.slice(1).forEach(row => {
          const name = String(row[0] || '').trim()
          const price = toNumber(row[1])
          if (name && price > 0) {
            hppMap[name] = price
          }
        })
        resolve(hppMap)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file HPP.'))
    reader.readAsArrayBuffer(file)
  })
}

export const DEFAULT_HPP_RATIO = 0
export const DEFAULT_TARGET_PROFIT = 0.15
export const FAKE_STAR_MARGIN_THRESHOLD = 0.05

/**
 * Hitung Harga Jual Minimal Baru dengan rumus:
 * Harga Baru = HPP / (1 - Rasio_Potongan_Marketplace - Target_Profit)
 * Bulatkan ke atas ke angka berakhiran .900 (contoh: 547900 -> 547900, 548000 -> 548900)
 */
export function calculateRecommendedPrice(totalModalUnit, feeRate, targetProfit) {
  if (!totalModalUnit || totalModalUnit <= 0) return null
  const denominator = Math.max(0.1, 1 - feeRate - targetProfit)
  if (denominator <= 0) return null
  const rawNewPrice = totalModalUnit / denominator
  // Bulatkan ke atas ke akhiran .900
  let recommended = Math.ceil(rawNewPrice / 1000) * 1000 - 100
  // Jika hasil pembulatan masih di bawah rawNewPrice, naikkan 1000 lagi agar margin tidak pernah kurang dari target
  if (recommended < rawNewPrice) recommended += 1000
  return Math.max(recommended, 0)
}

export function calculateAnalysis(rows, mapping, hppInputs = {}, marketplace = 'auto', targetProfit = DEFAULT_TARGET_PROFIT, packingCost = 0, adCost = 0) {
  const products = {}
  const claims = []
  const returnedOrders = []
  let totalRefundCosts = 0
  let globalDeductions = 0
  let totalUnitsSuccess = 0
  let totalUnitsReturned = 0

  // --- Langkah 1: Pecahan potongan marketplace dari kolom asli Excel ---
  const deductionBreakdownMap = {}

// Inisialisasi semua kolom potongan Shopee dengan label yang benar
const initShopeeDeductionColumns = () => {
  const columns = [
    { key: 'platformFee', label: 'Biaya Platform' },
    { key: 'freeShippingXtra', label: 'Biaya Gratis Ongkir XTRA' },
    { key: 'serviceFee', label: 'Biaya Layanan' },
    { key: 'promoFee', label: 'Biaya Promosi' },
    { key: 'otherFee', label: 'Biaya Lainnya' },
    { key: 'tax', label: 'Pajak' },
    { key: 'adminFee', label: 'Biaya Administrasi' },
    { key: 'transactionFee', label: 'Biaya Transaksi' },
    { key: 'shippingDifference', label: 'Selisih Ongkir' }
  ]
  columns.forEach(col => {
    if (!deductionBreakdownMap[col.key]) {
      deductionBreakdownMap[col.key] = { label: col.label, amount: 0 }
    }
  })
}

initShopeeDeductionColumns()

  // Kumpulkan semua nama kolom asli dari baris data untuk pencarian kolom potongan
  const allRowHeaders = rows.length > 0 ? Object.keys(rows[0]) : []

  /**
   * Temukan nama kolom asli (seperti di file Excel) untuk kunci potongan tertentu.
   * 1. Cek mapping dari smartMapHeaders
   * 2. Cek alias terhadap nama header asli (case-insensitive, normalized)
   */
  const findActualDeductionColumn = (key, aliases) => {
    // 1. Cek mapping dari smartMapHeaders
    if (mapping[key] && allRowHeaders.includes(mapping[key])) return mapping[key]
    // 2. Cek alias terhadap nama header asli (case-insensitive, normalized)
    const normAliases = aliases.map(a => normalizeHeader(a))
    for (const h of allRowHeaders) {
      if (normAliases.includes(normalizeHeader(h))) return h
    }
    return null
  }

  // Deduplikasi deductionColumns agar setiap key hanya diproses sekali per baris,
  // mencegah double-counting pada deductionBreakdownMap (Langkah 1)
  const rawDeductionColumns = [
    { key: 'shippingFee', label: 'Ongkir' },
    { key: 'platformCommission', label: 'Biaya Administrasi' },
    { key: 'affiliateCommission', label: 'Komisi Afiliasi' },
    { key: 'transactionFee', label: 'Biaya Transaksi' },
    { key: 'sellerDiscount', label: 'Diskon Penjual' },
    { key: 'orderProcessFee', label: 'Biaya Proses Pesanan' },
    { key: 'promoServiceFee', label: 'Biaya Layanan Promo XTRA' },
    { key: 'amsCommission', label: 'Komisi AMS' },
    { key: 'shippingSavingProgram', label: 'Program Hemat Ongkir' },
    { key: 'premium', label: 'Biaya Premi' },
    { key: 'tax', label: 'Pajak' },
    { key: 'additionalServiceFee', label: 'Biaya Layanan Tambahan' },
    { key: 'shippingDeduction', label: 'Potongan Ongkos Kirim' },
    { key: 'refund', label: 'Biaya Penyesuaian & Selisih Ongkir' },
    { key: 'discount', label: 'Diskon Penjual' },
    { key: 'voucher', label: 'Potongan Voucher' },
    { key: 'subsidi', label: 'Subsidi Ongkir' },
    // Tambahan kolom yang diminta
    { key: 'platformFee', label: 'Biaya Platform' },
    { key: 'freeShippingXtra', label: 'Biaya Gratis Ongkir XTRA' },
    { key: 'serviceFee', label: 'Biaya Layanan' },
    { key: 'promoFee', label: 'Biaya Promosi' },
    { key: 'adsFee', label: 'Biaya Iklan / Ads' },
    { key: 'otherFee', label: 'Biaya Lainnya' },
    { key: 'adminFee', label: 'Biaya Administrasi' },
    { key: 'adjustmentFee', label: 'Biaya Penyesuaian Pesanan' },
    { key: 'salesDiscount', label: 'Diskon Penjual (Tambahan)' },
    { key: 'commission', label: 'Komisi' },
    { key: 'shippingDifference', label: 'Selisih Ongkir' },
  ]
  const seenDeductionKeys = new Set()
  const deductionColumns = rawDeductionColumns.filter((dc) => {
    if (seenDeductionKeys.has(dc.key)) return false
    seenDeductionKeys.add(dc.key)
    return true
  })

  // Deteksi kolom potongan tambahan dari mapping cost_* (deteksi otomatis)
  const deductionCostKeys = []
  for (const [key, colName] of Object.entries(mapping)) {
    if (key.startsWith('cost_')) {
      deductionCostKeys.push({ key, label: colName })
    }
  }

  const get = (row, key, fallbackKeys = []) => {
    const mappedKey = mapping[key]
    if (mappedKey && row[mappedKey] !== undefined && row[mappedKey] !== '') {
      return toNumber(row[mappedKey])
    }
    for (const fb of fallbackKeys) {
      if (row[fb] !== undefined && row[fb] !== '') return toNumber(row[fb])
    }
    return 0
  }
  const getStr = (row, key, fallbackKeys = []) => {
    const mappedKey = mapping[key]
    if (mappedKey && row[mappedKey] !== undefined && row[mappedKey] !== '') {
      return String(row[mappedKey]).trim()
    }
    for (const fb of fallbackKeys) {
      if (row[fb] !== undefined && row[fb] !== '') return String(row[fb]).trim()
    }
    return ''
  }

  // Deteksi apakah file Excel memiliki kolom No. Pesanan / Order ID yang nyata
  const hasOrderIdColumn = !!mapping.orderId

  // Hitung jumlah produk unik per orderId untuk alokasi proporsional biaya packing
  const orderProductCounts = {}
  // Counter untuk urutan asli kemunculan produk (fixed order di tabel)
  let originalIndexCounter = 0

  for (const row of rows) {
    const orderId = getStr(row, 'orderId', ['No. Pesanan', 'order id', 'invoice'])
    if (orderId && hasOrderIdColumn) {
      if (!orderProductCounts[orderId]) orderProductCounts[orderId] = new Set()
      const productNameRaw = getStr(row, 'productName', ['Nama Produk', 'product name', 'produk']) || ''
      if (productNameRaw) orderProductCounts[orderId].add(productNameRaw.toLowerCase().trim())
    }
  }
  // Konversi Set ke angka
  const orderProductCountMap = {}
  for (const [oid, set] of Object.entries(orderProductCounts)) {
    orderProductCountMap[oid] = set.size
  }

  // Track orderId yang sudah memiliki settlementAmount terhitung untuk mencegah duplikasi
  const settledOrderIds = new Set()

  for (const row of rows) {
    const orderId = getStr(row, 'orderId', ['No. Pesanan', 'order id', 'invoice'])
    const productNameRaw = getStr(row, 'productName', ['Nama Produk', 'product name', 'produk']) || ''
    const sku = getStr(row, 'sku', ['SKU', 'sku', 'kode produk']) || ''
    // Dedup: jika orderId sudah pernah di-settlement, jangan tambahkan settlementAmount lagi (hindari 2x lipat)
    const isDuplicateSettlement = orderId && settledOrderIds.has(orderId)
    const settlement = isDuplicateSettlement ? 0 : get(row, 'settlementAmount', ['Total Penghasilan', 'settlement amount', 'amount'])
    if (orderId && !isDuplicateSettlement) settledOrderIds.add(orderId)
    const shippingFee = get(row, 'shippingFee', ['Ongkir', 'shipping fee', 'ongkos kirim'])
    const platformComm = get(row, 'platformCommission', ['Biaya Administrasi', 'platform commission', 'commission'])
    const affiliateComm = get(row, 'affiliateCommission', ['Affiliate Commission', 'komisi afiliasi'])
    const refund = get(row, 'refund', ['Nominal Pengembalian Dana', 'nominal pengembalian dana', 'Jumlah Pengembalian Dana', 'Pengembalian Dana', 'Total Pengembalian', 'refund', 'Refund', 'retur', 'pengembalian dana', 'biaya retur'])
    // Additional refund detection: scan cost_* columns for refund-related values
    let extraRefund = 0
    for (const [key, colName] of Object.entries(mapping)) {
      if (key.startsWith('cost_')) {
        const colLower = String(colName).toLowerCase()
        if (colLower.includes('refund') || colLower.includes('pengembalian') || colLower.includes('retur')) {
          const v = Math.abs(toNumber(row[colName]))
          if (v > 0) extraRefund += v
        }
      }
    }
    // Gunakan Math.abs agar nilai negatif (misal -115000 atau -Rp 115.000)
    // tetap terdeteksi sebagai pengembalian dana
    const refundAbs = isFinite(refund) ? Math.abs(refund) : 0
    const safeRefund = Math.max(refundAbs, extraRefund)
    const productPrice = get(row, 'productPrice', ['Harga Asli Produk', 'product price', 'price', 'harga jual'])
    const qty = get(row, 'quantity', ['Quantity', 'qty', 'jumlah']) || 1
    const estShipping = get(row, 'shippingEstimate', ['Estimasi Ongkir', 'estimated shipping'])
    const buyerShipping = get(row, 'buyerShipping', ['Ongkir Dibayar Pembeli', 'buyer shipping'])
    const resi = getStr(row, 'resi', ['Resi', 'no resi', 'tracking number'])

    // --- Biaya Shopee Terbaru ---
    const orderProcessFee = get(row, 'orderProcessFee', ['Biaya Proses Pesanan', 'order process fee'])
    const promoServiceFee = get(row, 'promoServiceFee', ['Biaya Layanan Promo XTRA', 'promo service fee'])
    const amsCommission = get(row, 'amsCommission', ['Biaya Komisi AMS', 'ams commission'])
    const shippingSavingProgram = get(row, 'shippingSavingProgram', ['Biaya Program Hemat Biaya Kirim', 'shipping saving program'])
    const premium = get(row, 'premium', ['Premi', 'biaya premi'])
    const tax = get(row, 'tax', ['Pajak', 'PPh 22', 'pajak'])
    const additionalServiceFee = get(row, 'additionalServiceFee', ['Biaya Layanan Tambahan', 'additional service fee'])
    const shippingDeduction = get(row, 'shippingDeduction', ['Potongan Ongkos Kirim dari Shopee', 'shipping deduction'])
    const shippingPaidToCourier = get(row, 'shippingPaidToCourier', ['Ongkos Kirim yang Dibayarkan ke Jasa Kirim', 'shipping paid to courier'])

    // --- Anti-error: pastikan semua nilai angka aman (tidak NaN/Infinity) ---
    const safeSettlement = isFinite(settlement) ? settlement : 0
    const safeShippingFee = isFinite(shippingFee) ? shippingFee : 0
    const safePlatformComm = isFinite(platformComm) ? platformComm : 0
    const safeAffiliateComm = isFinite(affiliateComm) ? affiliateComm : 0
    const safeProductPrice = isFinite(productPrice) ? productPrice : 0
    const safeQty = isFinite(qty) && qty > 0 ? qty : 1
    const safeEstShipping = isFinite(estShipping) ? estShipping : 0
    const safeBuyerShipping = isFinite(buyerShipping) ? buyerShipping : 0

    const safeOrderProcessFee = isFinite(orderProcessFee) ? orderProcessFee : 0
    const safePromoServiceFee = isFinite(promoServiceFee) ? promoServiceFee : 0
    const safeAmsCommission = isFinite(amsCommission) ? amsCommission : 0
    const safeShippingSavingProgram = isFinite(shippingSavingProgram) ? shippingSavingProgram : 0
    const safePremium = isFinite(premium) ? premium : 0
    const safeTax = isFinite(tax) ? tax : 0
    const safeAdditionalServiceFee = isFinite(additionalServiceFee) ? additionalServiceFee : 0
    const safeShippingDeduction = isFinite(shippingDeduction) ? shippingDeduction : 0
    const safeShippingPaidToCourier = isFinite(shippingPaidToCourier) ? shippingPaidToCourier : 0

    let extraCosts = 0
    for (const [key, colName] of Object.entries(mapping)) {
      if (key.startsWith('cost_')) {
        const v = toNumber(row[colName])
        extraCosts += isFinite(v) ? v : 0
      }
    }
    const safeExtraCosts = isFinite(extraCosts) ? extraCosts : 0

    // Semua biaya potongan Shopee baru dimasukkan ke total deductions
    const totalDeductions = safePlatformComm + safeAffiliateComm + safeExtraCosts
      + safeOrderProcessFee + safePromoServiceFee + safeAmsCommission
      + safeShippingSavingProgram + safePremium + safeTax + safeAdditionalServiceFee

    // Akumulasi pecahan potongan per kolom asli untuk Langkah 1
    // Gunakan Math.abs agar nilai negatif (-(12.388), -12388, (12.388))
    // tetap terakumulasi sebagai potongan positif di tabel Langkah 1
    // Cari nama kolom asli dari Excel untuk setiap kunci potongan
    deductionColumns.forEach((dc) => {
      const actualCol = findActualDeductionColumn(dc.key, COLUMN_ALIASES[dc.key] || [])
      if (!actualCol) return
      const val = toNumber(row[actualCol] || 0)
      if (val !== 0) {
        if (!deductionBreakdownMap[actualCol]) {
          deductionBreakdownMap[actualCol] = { label: actualCol, amount: 0 }
        }
        deductionBreakdownMap[actualCol].amount += Math.abs(val)
      }
    })

    // Akumulasi kolom potongan tambahan dari deteksi otomatis (cost_*)
    deductionCostKeys.forEach((dc) => {
      const val = get(row, dc.key)
      if (val !== 0) {
        if (!deductionBreakdownMap[dc.label]) {
          deductionBreakdownMap[dc.label] = { label: dc.label, amount: 0 }
        }
        deductionBreakdownMap[dc.label].amount += Math.abs(val)
      }
    })

    // Selisih Ongkir: hanya masukkan ke deductionBreakdown jika Estimasi Ongkir > Ongkir Dibayar Pembeli
    const autoShippingDiff = safeEstShipping - safeBuyerShipping
    if (autoShippingDiff > 5000) {
      if (!deductionBreakdownMap['shippingDifference']) {
        deductionBreakdownMap['shippingDifference'] = { label: 'Selisih Ongkir', amount: 0 }
      }
      deductionBreakdownMap['shippingDifference'].amount += autoShippingDiff
    }

    const netSettlement = safeSettlement - totalDeductions - safeRefund
    const units = Math.max(safeQty, 1)
    const pricePerUnit = safeProductPrice > 0 ? safeProductPrice : safeSettlement / units

    // --- Deteksi baris "Total / Ringkasan / Grand Total" di bawah tabel ---
    // Hanya buang baris yang BENAR-BENAR ringkasan (tidak punya No. Pesanan atau
    // No. Pesanan-nya sendiri mengandung kata total). Jangan buang baris transaksi
    // valid yang memiliki No. Pesanan meski berada di bagian bawah tabel.
    const upperName = productNameRaw.toUpperCase()
    const upperOrderId = String(orderId || '').toUpperCase()
    const isTotalRow = /total|ringkasan|grand total|sub total|jumlah total|keseluruhan/i.test(upperName)
      && (!orderId || /total|ringkasan|grand total|sub total|jumlah total|keseluruhan/i.test(upperOrderId))
    if (isTotalRow) continue // skip baris ringkasan, jangan dihitung sebagai produk

    // Deteksi baris potongan global non-produk (tanpa Nama Produk)
    if (!productNameRaw || productNameRaw.trim() === '') {
      if (safeSettlement > 0 || totalDeductions > 0 || safeRefund > 0) {
        globalDeductions += safeSettlement - totalDeductions - safeRefund
      }
      continue // skip grouping sebagai produk
    }

    // Normalisasi nama produk untuk grouping (case-insensitive, trim, hapus spasi berlebih)
    const productName = productNameRaw.trim()
    const productKey = productName.toLowerCase().replace(/\s+/g, ' ')

    // Deteksi offset ongkir: jika Potongan Ongkos Kirim dari Shopee
    // sudah menutupi Ongkos Kirim yang Dibayarkan ke Jasa Kirim,
    // subtotal ongkir Rp0 → tidak dianggap kerugian ongkir penjual.
    const netShippingCost = safeShippingFee + safeShippingPaidToCourier - safeShippingDeduction
    const shippingOffset = Math.abs(netShippingCost) < 1000 // toleransi Rp1.000

    // Klaim selisih ongkir (hanya jika estShipping melebihi buyerShipping secara signifikan
    // DAN tidak ada offset ongkir yang menutup biaya)
    if (!shippingOffset && safeEstShipping > 0 && safeBuyerShipping >= 0 && safeEstShipping > safeBuyerShipping + 5000) {
      claims.push({
        orderId: orderId || `ORD-${Date.now()}`, product: productName, sku,
        resi: resi || '-', paidShipping: safeBuyerShipping, estimatedShipping: safeEstShipping,
        difference: safeEstShipping - safeBuyerShipping,
      })
    }

    // Deteksi status pesanan retur/batal dari kolom Status Pesanan
    const orderStatus = getStr(row, 'orderStatus', ['Status Pesanan', 'status', 'status pesanan', 'order status', 'order_status'])
    const isReturnStatus = /retur|pengembalian|batal|cancel/i.test(orderStatus)

    // Kumpulkan detail pesanan retur untuk transparansi biaya hangus
    // Deteksi berdasarkan nominal refund > 0 ATAU status pesanan mengandung kata retur/pengembalian/batal
    if (safeRefund > 0 || isReturnStatus) {
      // Biaya hangus = semua potongan operasional pada baris retur (kecuali refund itu sendiri)
      let lostFeeAmount = 0
      deductionColumns.forEach((dc) => {
        if (dc.key === 'refund') return
        const actualCol = findActualDeductionColumn(dc.key, COLUMN_ALIASES[dc.key] || [])
        if (!actualCol) return
        const val = toNumber(row[actualCol] || 0)
        if (val !== 0) lostFeeAmount += Math.abs(val)
      })
      returnedOrders.push({
        orderId: orderId || '-',
        productName: productName,
        sku: sku || '-',
        qty: safeQty,
        productPrice: safeProductPrice,
        refundAmount: safeRefund,
        lostFeeAmount: lostFeeAmount,
      })
      totalRefundCosts += lostFeeAmount
      totalUnitsReturned += safeQty
      continue // Jangan masukkan baris retur ke tabel produk sukses — hanya ke returnedOrders
    } else {
      totalUnitsSuccess += safeQty
    }

    if (!products[productKey]) {
      products[productKey] = {
        id: productKey, name: productName, sku, orders: 0, unitsSold: 0,
        unitsSoldSuccess: 0, unitsSoldReturned: 0,
        grossRevenue: 0, settlementAmount: 0, settlementAmountSuccess: 0,
        marketplaceFees: 0, shippingCost: 0,
        refunds: 0, extraCosts: 0, hpp: hppInputs[productKey] || 0,
        hppAutoEstimate: 0, netProfit: 0, netMargin: 0, category: 'normal',
        recommendedPrice: 0,
        originalColumns: {},
        uniqueOrders: new Set(),
        packingMode: 'perOrder',
        packingCostPerUnit: 0,
        originalIndex: originalIndexCounter++,
      }
    }
    // Catat nama kolom asli dari file Excel untuk transparansi audit
    const p0 = products[productKey]
    if (mapping.orderId && row[mapping.orderId] !== undefined) p0.originalColumns.orderId = mapping.orderId
    if (mapping.productName && row[mapping.productName] !== undefined) p0.originalColumns.productName = mapping.productName
    if (mapping.sku && row[mapping.sku] !== undefined) p0.originalColumns.sku = mapping.sku
    if (mapping.settlementAmount && row[mapping.settlementAmount] !== undefined) p0.originalColumns.settlementAmount = mapping.settlementAmount
    if (mapping.productPrice && row[mapping.productPrice] !== undefined) p0.originalColumns.productPrice = mapping.productPrice
    if (mapping.quantity && row[mapping.quantity] !== undefined) p0.originalColumns.quantity = mapping.quantity
    if (mapping.shippingFee && row[mapping.shippingFee] !== undefined) p0.originalColumns.shippingFee = mapping.shippingFee
    if (mapping.platformCommission && row[mapping.platformCommission] !== undefined) p0.originalColumns.platformCommission = mapping.platformCommission
    if (mapping.refund && row[mapping.refund] !== undefined) p0.originalColumns.refund = mapping.refund
    const p = products[productKey]
    p.orderId = orderId
    p.orders += 1
    if (orderId) p.uniqueOrders.add(orderId)
    p.unitsSold += safeQty
    p.grossRevenue += pricePerUnit * safeQty
    if (safeRefund > 0) {
      p.unitsSoldReturned += safeQty
    } else {
      p.unitsSoldSuccess += safeQty
      p.settlementAmountSuccess += safeSettlement
    }
    p.settlementAmount += netSettlement
    p.marketplaceFees += totalDeductions
    p.shippingCost += shippingFee
    p.refunds += refund
    p.extraCosts += extraCosts
  }

  // Akumulasi total unit sukses dan retur dari semua produk
  totalUnitsSuccess = Object.values(products).reduce((acc, p) => acc + (p.unitsSoldSuccess || 0), 0)
  totalUnitsReturned = Object.values(products).reduce((acc, p) => acc + (p.unitsSoldReturned || 0), 0)

  const totalMarketplaceFees = Object.values(products).reduce((acc, p) => acc + p.marketplaceFees, 0)
    const totalSettlement = Object.values(products).reduce((acc, p) => acc + p.settlementAmount, 0)
    const marketplaceFeeRatio = totalSettlement > 0 ? totalMarketplaceFees / totalSettlement : 0.1
    const productList = Object.values(products).map(p => {
    // HPP selalu 0 sampai pelanggan mengisi sendiri (tidak ada estimasi otomatis)
    p.hppAutoEstimate = 0
    const effectiveHpp = p.hpp || 0
    p.hppTotal = effectiveHpp * p.unitsSoldSuccess
    // Konversi Set uniqueOrders menjadi jumlah pesanan unik
    p.uniqueOrderCount = p.uniqueOrders instanceof Set ? p.uniqueOrders.size : (p.uniqueOrders || 0)
    // Jika file tidak memiliki kolom No. Pesanan, kunci mode packing ke Per Pcs
    // (tidak bisa mengakresi resi tanpa nomor pesanan)
    const effectivePackingMode = hasOrderIdColumn ? (p.packingMode || 'perOrder') : 'perUnit'
    p.packingMode = effectivePackingMode
    // Biaya packing per unit berdasarkan packing mode produk
    const totalPacking = effectivePackingMode === 'perUnit'
      ? packingCost * p.unitsSoldSuccess
      : packingCost * p.uniqueOrderCount
    const packingCostPerUnit = p.unitsSoldSuccess > 0 ? totalPacking / p.unitsSoldSuccess : 0
    p.packingCostPerUnit = packingCostPerUnit
    p.totalPackingProduk = totalPacking
    const effectiveHppWithPacking = effectiveHpp + packingCostPerUnit

    // --- Proteksi NaN/Infinity di semua operasi aritmatika per-produk ---
    const safeSettlementAmt = isFinite(p.settlementAmountSuccess) ? p.settlementAmountSuccess : 0
    const safeHppTotal = isFinite(p.hppTotal) ? p.hppTotal : 0
    const safePackingTotal = isFinite(p.packingCostPerUnit * p.unitsSoldSuccess) ? p.packingCostPerUnit * p.unitsSoldSuccess : 0
    p.netProfit = safeSettlementAmt - safeHppTotal - safePackingTotal
    if (!isFinite(p.netProfit)) p.netProfit = 0

    p.netMargin = safeSettlementAmt > 0 ? (p.netProfit / safeSettlementAmt) * 100 : 0
    if (!isFinite(p.netMargin)) p.netMargin = 0

    if (p.netProfit < 0) p.category = 'loss'
    else if (p.netMargin < FAKE_STAR_MARGIN_THRESHOLD * 100 && p.unitsSoldSuccess >= 5) p.category = 'fakestar'
    else p.category = 'normal'

    const safeFees = isFinite(p.marketplaceFees) ? p.marketplaceFees : 0
    const safeShip = isFinite(p.shippingCost) ? p.shippingCost : 0
    const safeRefund = isFinite(p.refunds) ? p.refunds : 0
    let perUnitFees = p.unitsSold > 0 ? (safeFees + safeShip + safeRefund) / p.unitsSold : 0
    if (!isFinite(perUnitFees)) perUnitFees = 0

    const calcPrice = calculateRecommendedPrice(effectiveHppWithPacking, marketplaceFeeRatio, targetProfit)
    p.recommendedPrice = calcPrice !== null && isFinite(calcPrice) ? calcPrice : 0
    return p
  })

  productList

  // --- FIX: Deduplicate revenue per Order ID ---
  // Jika 1 Order ID berisi multiple produk, hindari perhitungan lipat:
  // - Grup produk per Order ID
  // - Hitung settlementAmount secara proporsional berdasarkan grossRevenue masing-masing produk
  // - Hanya hitung 1 kali per No. Pesanan untuk Total Dana Bersih Cair
  const dedupByOrderId = () => {
    // Hanya lakukan deduplication jika ada orderId di data
    const hasOrderId = productList.some(p => p.orderId)
    if (!hasOrderId) return productList // Jika tidak ada orderId, return asli

    const orderMap = new Map()
    productList.forEach((p) => {
      const oId = p.orderId
      if (!oId) return
      if (!orderMap.has(oId)) {
        // Ambil settlement dari baris pertama saja per Order ID,
        // agar tidak terhitung ganda jika Excel duplikasi nilai settlement per baris produk
        orderMap.set(oId, { totalGross: 0, totalSettlement: p.settlementAmount || 0, count: 0 })
      }
      const entry = orderMap.get(oId)
      entry.totalGross += p.grossRevenue || 0
      entry.count += 1
    })
    // Jika tidak ada orderMap, return productList asli
    if (orderMap.size === 0) return productList

    const dedupInfo = productList.map((p, i) => {
      const oId = p.orderId
      const entry = orderMap.get(oId)
      return {
        ...p,
        // Gunakan settlement proporsional per product dalam order
        settlementAmount: entry ? isFinite(entry.totalSettlement) ? Math.round((p.grossRevenue || 0) / Math.max(entry.totalGross, 1) * entry.totalSettlement) : p.settlementAmount : p.settlementAmount,
        // Tandai bahwa ini adalah allocasi deduplicated
        _isDeduplicated: !!entry,
      }
    })
    return dedupInfo
  }

  const dedupedProductList = dedupByOrderId()

  const lossProducts = dedupedProductList.filter(p => p.category === 'loss')
  const fakeStarProducts = productList.filter(p => p.category === 'fakestar')

  // --- Proteksi NaN di semua agregasi summary ---
  const safeReduce = (arr, key) => arr.reduce((s, p) => {
    const v = isFinite(p[key]) ? p[key] : 0
    return s + v
  }, 0)

  // Ambil semua nilai yang dibutuhkan untuk laba bersih sesungguhnya dengan default 0
  const baseSettlementAmount = safeReduce(dedupedProductList, 'settlementAmount')
  const totalHppVal = safeReduce(dedupedProductList, 'hppTotal')
  const totalPackingVal = safeReduce(dedupedProductList, 'totalPackingProduk')
  const totalAdCostVal = adCost // diteruskan dari ResultsSection via page.js
  
  const summary = {
    totalOrders: safeReduce(dedupedProductList, 'orders'),
    totalUnits: safeReduce(dedupedProductList, 'unitsSold'),
    totalUnitsSuccess: totalUnitsSuccess,
    totalUnitsReturned: totalUnitsReturned,
    totalAllUnits: totalUnitsSuccess + totalUnitsReturned,
    grossRevenue: safeReduce(dedupedProductList, 'grossRevenue'),
    settlementAmount: baseSettlementAmount,
    totalFees: safeReduce(dedupedProductList, 'marketplaceFees'),
    totalShipping: safeReduce(dedupedProductList, 'shippingCost'),
    totalRefunds: safeReduce(dedupedProductList, 'refunds'),
    totalHpp: safeReduce(dedupedProductList, 'hppTotal'),
    // Langkah 3: Total biaya packing dari semua produk (per pcs)
    totalPacking: safeReduce(dedupedProductList, 'totalPackingProduk'),
    // Langkah 4: Total biaya kemasan luar paket per no. resi unik (opsional)
    totalPackingPerResi: safeReduce(dedupedProductList, 'totalPackingPerResiProduk'),
    // Langkah 1: Total omzet kotor dari harga jual di Excel
    totalGross: safeReduce(dedupedProductList, 'grossRevenue'),
    // Langkah 1: Pecahan potongan marketplace per kolom asli (hanya entri > 0)
    deductionBreakdown: Object.values(deductionBreakdownMap).filter(d => d.amount > 0),
    // Langkah 1: Total selisih potongan (Omzet Kotor − Dana Bersih Cair)
    totalGrossDeduction: safeReduce(dedupedProductList, 'grossRevenue') - safeReduce(dedupedProductList, 'settlementAmount'),
    // Langkah 3: Total biaya iklan/ads periode ini (opsional, diteruskan dari ResultsSection)
    totalAdCost: adCost,
    // Langkah 3: Laba Bersih Sesungguhnya = Dana Bersih Cair - Modal HPP - Packing - Iklan
    labaBersihSesungguhnya: isFinite(baseSettlementAmount) && isFinite(totalHppVal) && isFinite(totalPackingVal) && isFinite(totalAdCostVal)
      ? baseSettlementAmount - totalHppVal - totalPackingVal - totalAdCostVal
      : baseSettlementAmount,
    // globalDeductions dikurangkan dari netProfit agar laba bersih benar-benar akurat
    netProfit: safeReduce(dedupedProductList, 'netProfit') - (isFinite(globalDeductions) ? globalDeductions : 0),
    totalLoss: safeReduce(lossProducts, 'netProfit') < 0 ? Math.abs(safeReduce(lossProducts, 'netProfit')) : 0,
    totalClaims: claims.length,
    claimAmount: (() => {
      let total = 0
      if (claims && Array.isArray(claims)) {
        for (let i = 0; i < claims.length; i++) {
          const v = isFinite(claims[i].difference) ? claims[i].difference : 0
          total += v
        }
      }
      return total
    })(),
    // pastikan claimAmount selalu memiliki nilai (default 0 jika claims kosong atau reduce gagal)
    lossProductCount: lossProducts.length > 0 ? lossProducts.length : 0,
    fakeStarCount: fakeStarProducts.length,
    totalRefundCosts: isFinite(totalRefundCosts) ? totalRefundCosts : 0,
    biayaHangusRetur: isFinite(totalRefundCosts) ? totalRefundCosts : 0,
    globalDeductions: isFinite(globalDeductions) ? globalDeductions : 0,
    returnedOrders: returnedOrders,
    hasOrderIdColumn: hasOrderIdColumn,
  }

  // Kumpulkan semua nama kolom asli dari mapping untuk ditampilkan di Langkah 1
  const detectedColumns = Object.values(mapping).filter(Boolean)

  return { summary, products: productList, lossProducts, fakeStarProducts, claims, returnedOrders, hasOrderIdColumn, detectedColumns }
}

export function generateMassUpdateExcel(
  products,
  targetProfit = 0.15,
  packingCost = 0,
  packingCostPerProduct = {},
  packingMode = {},
  feeRatio = 0.1,
  summary = {},
  adCostPeriod = 0
) {
  const rows = []

  for (const p of products) {
    const units = Math.max(p.unitsSold || 0, 1)
    const orders = p.orders || 0
    const uniqueOrderCount = Number(p.uniqueOrderCount) || orders || 0
    const hppValue = Number(p.hpp) || 0
    const packingCostVal = Number(packingCostPerProduct[p.id]) || 0
    const mode = packingMode[p.id] || 'perOrder'

    const totalPackingProduk = mode === 'perUnit'
      ? packingCostVal * units
      : packingCostVal * uniqueOrderCount
    const packingPerUnit = units > 0 ? totalPackingProduk / units : 0

    const grossRevenue = p.grossRevenue || p.totalGross || 0
    const oldPrice =
      p.productPrice > 0
        ? p.productPrice
        : units > 0
          ? grossRevenue / units
          : 0
    const netReceivedPerUnit =
      units > 0 ? (p.settlementAmount || 0) / units : 0

    const computedFeeRate =
      oldPrice > netReceivedPerUnit
        ? Math.min((oldPrice - netReceivedPerUnit) / oldPrice, 0.75)
        : feeRatio

    const totalModalUnit = hppValue + packingPerUnit

    const recommendedPrice = calculateRecommendedPrice(
      totalModalUnit,
      computedFeeRate,
      targetProfit
    )

    let finalRecommendedPrice = recommendedPrice
    const netProfitProduk =
      (p.settlementAmount || 0) - (hppValue * units + totalPackingProduk)

    if (
      netProfitProduk < 0 &&
      finalRecommendedPrice > 0 &&
      finalRecommendedPrice <= oldPrice
    ) {
      finalRecommendedPrice = Math.ceil(oldPrice / 1000) * 1000 - 100
      if (finalRecommendedPrice <= oldPrice) finalRecommendedPrice += 1000
    }

    const realNetRevenue =
      finalRecommendedPrice > 0
        ? finalRecommendedPrice * (1 - computedFeeRate)
        : 0
    const realProfitPerUnit =
      finalRecommendedPrice > 0 ? realNetRevenue - totalModalUnit : 0
    const realMarginPercent =
      finalRecommendedPrice > 0
        ? (realProfitPerUnit / finalRecommendedPrice) * 100
        : 0

    const hasHpp = hppValue > 0 || packingCostVal > 0

    const priceDiff = hasHpp ? (finalRecommendedPrice - oldPrice) : 0

    let statusBaru
    const isMarginAboveTarget = finalRecommendedPrice > 0 && finalRecommendedPrice < oldPrice
    if (realProfitPerUnit <= 0) {
      statusBaru = 'Rugi'
    } else if (isMarginAboveTarget) {
      statusBaru = 'Sehat (Harga Lama Sudah di Atas Target)'
    } else if (realMarginPercent > 0 && realMarginPercent < 10) {
      statusBaru = 'Margin Tipis'
    } else {
      statusBaru = 'Sehat (Untung)'
    }

    const marketplaceDeductionPerUnit = oldPrice * computedFeeRate

    const oldProfitPerUnit =
      oldPrice > 0
        ? oldPrice - marketplaceDeductionPerUnit - totalModalUnit
        : 0

    rows.push({
      no: rows.length + 1,
      sku: p.sku || '-',
      name: p.name,
      unitsSold: units,
      oldPrice: Math.round(oldPrice),
      marketplaceDeduction: Math.round(marketplaceDeductionPerUnit),
      hpp: Math.round(hppValue),
      packingPerUnit: Math.round(packingPerUnit),
      oldProfit: Math.round(oldProfitPerUnit),
      marginLama: oldPrice > 0 ? Math.round((oldProfitPerUnit / oldPrice) * 1000) / 10 : 0,
      targetProfitPct: targetProfit * 100,
      newPrice: hasHpp ? Math.round(finalRecommendedPrice) : 0,
      priceDiff: Math.round(priceDiff),
      estProfit: Math.round(realProfitPerUnit),
      estMargin: Math.round(realMarginPercent * 10) / 10,
      status: hasHpp ? statusBaru : 'Belum Diisi HPP',
      hasHpp,
    })
  }

  // ================================================================
  // SHEET 1: Rekomendasi_Harga_Baru
  // ================================================================
  const ws1Data = [
    [
      'No',
      'Kode SKU',
      'Nama Produk',
      'Terjual Sukses (Pcs)',
      'Harga Jual Lama (Rp)',
      'Potongan Marketplace / Pcs (Rp)',
      'Modal HPP / Pcs (Rp)',
      'Biaya Packing / Pcs (Rp)',
      'Laba/Rugi Lama / Pcs (Rp)',
      'Margin Lama (%)',
      'Target Profit (%)',
      'Harga Jual Baru (Rp)',
      'Selisih Harga (Rp)',
      'Estimasi Untung Baru / Pcs (Rp)',
      'Estimasi Margin Baru (%)',
      'Status & Rekomendasi',
    ],
  ]

  for (const r of rows) {
    ws1Data.push([
      r.no,
      r.sku,
      r.name,
      r.unitsSold,
      r.oldPrice,
      r.marketplaceDeduction,
      r.hpp,
      r.packingPerUnit,
      r.oldProfit,
      r.marginLama,
      r.targetProfitPct,
      r.hasHpp ? r.newPrice : 'Belum Diisi HPP',
      r.priceDiff,
      r.estProfit,
      r.estMargin,
      r.status,
    ])
  }

  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data)

  for (let rowIdx = 2; rowIdx <= ws1Data.length; rowIdx++) {
    ws1[`J${rowIdx}`] = { t: 'n', v: ws1Data[rowIdx - 1][9] / 100, z: '0.0%' }
    ws1[`K${rowIdx}`] = { t: 'n', v: ws1Data[rowIdx - 1][10] / 100, z: '0%' }
    ws1[`O${rowIdx}`] = { t: 'n', v: ws1Data[rowIdx - 1][14] / 100, z: '0.0%' }
  }

  const widths1 = [
    { wch: 5 },   // No
    { wch: 15 },  // Kode SKU
    { wch: 35 },  // Nama Produk
    { wch: 15 },  // Terjual Sukses (Pcs)
    { wch: 18 },  // Harga Jual Lama (Rp)
    { wch: 22 },  // Potongan Marketplace / Pcs (Rp)
    { wch: 18 },  // Modal HPP / Pcs (Rp)
    { wch: 18 },  // Biaya Packing / Pcs (Rp)
    { wch: 18 },  // Laba/Rugi Lama / Pcs (Rp)
    { wch: 12 },  // Margin Lama (%)
    { wch: 12 },  // Target Profit (%)
    { wch: 18 },  // Harga Jual Baru (Rp)
    { wch: 18 },  // Selisih Harga (Rp)
    { wch: 20 },  // Estimasi Untung Baru / Pcs (Rp)
    { wch: 15 },  // Estimasi Margin Baru (%)
    { wch: 25 },  // Status & Rekomendasi
  ]
  ws1['!cols'] = widths1

  // ================================================================
  // SHEET 2: Ringkasan_Audit_Toko
  // ================================================================
  const totalGross = summary?.totalGross || 0
  const totalGrossDeduction = summary?.totalGrossDeduction || 0
  const settlementAmount = summary?.settlementAmount || 0
  const totalHpp = summary?.totalHpp || 0
  const totalRefundCosts = summary?.totalRefundCosts || 0

  let totalPackingAll = 0
  for (const p of products) {
    const units = Math.max(p.unitsSold || 0, 1)
    const orders = p.orders || 0
    const uniqueOrderCount = Number(p.uniqueOrderCount) || orders || 0
    const packingCostVal = Number(packingCostPerProduct[p.id]) || 0
    const mode = packingMode[p.id] || 'perOrder'
    const totalPackingProduk = mode === 'perUnit'
      ? packingCostVal * units
      : packingCostVal * uniqueOrderCount
    totalPackingAll += totalPackingProduk
  }

  const labaBersih =
    settlementAmount - totalHpp - totalPackingAll - adCostPeriod - totalRefundCosts

  const ws2Data = [
    ['Ringkasan Audit Toko', 'Nilai'],
    ['Total Omzet Kotor', totalGross],
    ['Total Potongan Marketplace', totalGrossDeduction],
    ['Total Dana Bersih Cair', settlementAmount],
    ['Total Modal HPP', totalHpp],
    ['Total Biaya Packing', totalPackingAll],
    ['Total Biaya Iklan / Ads', adCostPeriod],
    ['Biaya Hangus Akibat Retur', totalRefundCosts],
    ['Laba Bersih Sesungguhnya', labaBersih],
  ]

  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data)

  for (let rowIdx = 2; rowIdx <= ws2Data.length; rowIdx++) {
    ws2[`B${rowIdx}`] = { t: 'n', v: ws2Data[rowIdx - 1][1], z: '"Rp"#,##0' }
  }

  const widths2 = [{ wch: 35 }, { wch: 20 }]
  ws2['!cols'] = widths2

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws1, 'Rekomendasi_Harga_Baru')
  XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan_Audit_Toko')

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
}

export function formatRupiah(amount) {
  const n = Math.round(amount || 0)
  return 'Rp ' + n.toLocaleString('id-ID')
}

export function formatPercent(val) {
  const n = isFinite(val) ? val : 0
  return `${n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

/* ============================================================================
   FIXED PRODUCTS DATA - 5 produk tetap untuk semua marketplace
   ============================================================================ */

const FIXED_PRODUCTS = [
  {
    name: 'Kemeja Katun Premium',
    sku: 'KM001',
    hpp: 65000,
    discount: 10,
    qty: 1,
  },
  {
    name: 'Botol Minum Sport 1L',
    sku: 'BS001',
    hpp: 25000,
    discount: 0,
    qty: 1,
  },
  {
    name: 'Kaos Polos Combed 30s',
    sku: 'CP001',
    hpp: 20000,
    discount: 15,
    qty: 50,
  },
  {
    name: 'Tas Ransel Laptop Waterproof',
    sku: 'TR001',
    hpp: 80000,
    discount: 5,
    qty: 10,
  },
  {
    name: 'Headset Bluetooth TWS',
    sku: 'HB001',
    hpp: 30000,
    discount: 10,
    qty: 20,
  },
]

/* ============================================================================
   Generate 100 transaksi simulasi untuk setiap marketplace
   ============================================================================ */

export function generateExampleData(marketplace = 'shopee') {
  const data = []
  const baseOrderId = marketplace === 'shopee' ? 1000001 :
    marketplace === 'tiktok' ? 2000001 :
    marketplace === 'tokopedia' ? 3000001 :
    marketplace === 'lazada' ? 4000001 : 5000001

  const distribution = [20, 20, 20, 20, 20]

  for (let prodIdx = 0; prodIdx < FIXED_PRODUCTS.length; prodIdx++) {
    const product = { ...FIXED_PRODUCTS[prodIdx] }
    const count = distribution[prodIdx] || 20
    const idOffset = prodIdx * 20

    for (let i = 0; i < count; i++) {
      const orderId = baseOrderId + idOffset + i

      // === Hitung nilai-nilai dasar per baris ===
      const salePrice = prodIdx === 0 ? 145000 :
        prodIdx === 1 ? 38000 :
        prodIdx === 2 ? 60000 :
        prodIdx === 3 ? 105000 : 50000

      const discPct = product.discount
      const discAmount = Math.round(salePrice * discPct / 100)
      const adminFee = Math.round(salePrice * 0.10)
      const transFee = Math.round(salePrice * 0.03)
      const buyerOngkir = Math.round(salePrice * 0.05)

      // === Tas Ransel (prodIdx 3): 10 baris pertama dengan selisih ongkir Rp30.000 ===
      let estOngkir, ongkirDibayar
      if (prodIdx === 3 && i < 10) {
        ongkirDibayar = 0
        estOngkir = 30000
      } else {
        ongkirDibayar = buyerOngkir
        estOngkir = buyerOngkir
      }

      // === Headset (prodIdx 4): 5 baris pertama dengan Pengembalian Dana ===
      let refund = 0
      if (prodIdx === 4 && i < 5) {
        refund = Math.round(salePrice * 0.10)
      }

      const totalSettlement = salePrice - discAmount - adminFee - transFee - ongkirDibayar - estOngkir - refund

      // === Buat objek baris dengan SEMUA kemungkinan nama kolom ===
      const item = {
        // No. Pesanan / No Invoice / Order ID (semua marketplace)
        'No. Pesanan': `PESANAN${orderId}`,
        'No Invoice': `INV${orderId}`,
        'Order ID': `ORD${orderId}`,

        // Nama Produk / Product Name
        'Nama Produk': product.name,
        'Product Name': product.name,

        // SKU
        SKU: product.sku,

        // Jumlah Terjual / Quantity / Quantity Sold (selalu 1)
        'Jumlah Terjual': 1,
        Quantity: 1,
        'Quantity Sold': 1,

        // Harga Produk / Harga Jual Kotor
        'Harga Asli Produk': salePrice,
        'Harga Produk': salePrice,
        'Product Price': salePrice,

        // Diskon
        'Diskon Penjual': `${discPct}%`,
        Diskon: `${discPct}%`,
        'Seller Discount': `${discPct}%`,

        // Biaya Administrasi / Platform Commission / Platform Fee
        'Biaya Administrasi': adminFee,
        'Platform Commission': adminFee,
        'Platform Fee': adminFee,

        // Biaya Transaksi
        'Biaya Transaksi': transFee,

        // Biaya Layanan Gratis Ongkir XTRA (khusus Shopee)
        'Biaya Layanan Gratis Ongkir XTRA': 0,

        // Ongkir Dibayar Pembeli / Buyer Shipping / Ongkir
        'Ongkir Dibayar Pembeli': ongkirDibayar,
        'Buyer Shipping': ongkirDibayar,
        Ongkir: ongkirDibayar,

        // Estimasi Ongkir Jasa Kirim / Shipping Fee (Ongkir Kurir)
        'Estimasi Ongkir Jasa Kirim': estOngkir,
        'Shipping Fee': estOngkir,

        // Pengembalian Dana / Pengembalian / Refund
        'Pengembalian Dana': refund,
        Pengembalian: refund,
        Refund: refund,

        // Total Penghasilan / Settlement Amount / Total Income
        'Total Penghasilan': totalSettlement,
        'Settlement Amount': totalSettlement,
        'Total Income': totalSettlement,

        // Resi / No Resi / Tracking Number
        Resi: `RESI${orderId}`,
        'No Resi': `RESI${orderId}`,
        'Tracking Number': `RESI${orderId}`,
      }

      data.push(item)
    }
  }

  return data
}

export function downloadExampleFile(marketplace = 'shopee') {
  const data = generateExampleData(marketplace)
  const columns = MARKETPLACE_COLUMNS[marketplace] || MARKETPLACE_COLUMNS.shopee
  // Convert each data object to array matching column order for aoa_to_sheet
  const wsData = [columns, ...data.map(row => columns.map(col => row[col] ?? ''))]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Example Data - ${marketplace}`)
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `contoh-data-${marketplace}-${new Date().getDate()}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

/* ============================================================================
   HELPER FUNCTIONS
   ============================================================================ */

export function getMarketplaceColumnNames(marketplace = 'shopee') {
  return MARKETPLACE_COLUMNS[marketplace] || MARKETPLACE_COLUMNS.shopee
}

export function getMarketplaceNames() {
  return ['Shopee', 'TikTok Shop', 'Tokopedia', 'Lazada', 'Bukalapak']
}

