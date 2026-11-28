/* ============================================================================
   KAMUS RAKASASA 10 GENERASI - "Tahan Banting 10 Generasi"
   Alias kolom untuk seluruh marketplace Indonesia & global
   (Shopee, TikTok Shop, Tokopedia, Lazada, Bukalapak, Blibli, Zalora
   serta software akuntansi / POS / ERP) dan aturan pola akar kata.
   ============================================================================ */

const PUNCTUATION_RE = /[_\-/\.:;#*\[\]()]/g

/* ---------- 1. Normalisasi Berlapis Sebelum Pencocokan ---------- */

/**
 * Kompatibilitas mundur: mengembalikan cleanFull (string).
 * Seluruh teks dibersihkan termasuk teks di dalam tanda kurung (ÔÇª).
 */
function normalizeHeader(h) {
  return normalizeHeaderDeep(h).cleanFull
}

/**
 * Dual-version normalisasi.
 *   cleanFull : seluruh teks bersih, isi kurung (ÔÇª) dipertahankan.
 *   cleanBase : teks utama, seluruh isi kurung (ÔÇª) dihilangkan.
 *   original  : nama header asli (trim).
 */
function normalizeHeaderDeep(h) {
  const original = String(h ?? '').trim()
  const lowered = original.toLowerCase()
  // cleanFull: tanda baca (termasuk kurung) -> spasi; isi kurung dipertahankan
  let cleanFull = lowered.replace(PUNCTUATION_RE, ' ').replace(/\s+/g, ' ').trim()
  // cleanBase: hapus isi kurung (ÔÇª), lalu bersihkan tanda baca sisa
  let cleanBase = lowered
    .replace(/\([^)]*\)/g, ' ')
    .replace(PUNCTUATION_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return { cleanFull, cleanBase, original }
}

/* ---------- 2. Skor pencocokan ---------- */

function scoreMatch(header, alias) {
  if (!header || !alias) return 0
  if (header === alias) return 100
  if (header.includes(alias)) return 85
  if (alias.includes(header)) return 70

  const hWords = header.split(' ').filter(Boolean)
  const aWords = alias.split(' ').filter(Boolean)

  const overlap = hWords.filter(w => aWords.includes(w)).length
  if (overlap > 0) return 60 + overlap * 5

  let partialOverlap = 0
  for (const hw of hWords) {
    for (const aw of aWords) {
      if (hw.length >= 4 && aw.length >= 4 && (hw.includes(aw) || aw.includes(hw))) {
        partialOverlap++
        break
      }
    }
  }
  if (partialOverlap > 0) return 45 + partialOverlap * 3

  return 0
}

/* ---------- 3. Kamus raksasa 10 generasi ---------- */

const ALIASES = {}

function _add(key, list) {
  if (!ALIASES[key]) ALIASES[key] = []
  for (const a of list) if (!ALIASES[key].includes(a)) ALIASES[key].push(a)
}

// --- orderId (No. Pesanan / Transaksi) ---
_add('orderId', [
  'no pesanan', 'nomor pesanan', 'no order', 'nomor order', 'order id', 'order number',
  'order sn', 'order adjustment id', 'order/adjustment id', 'adjustment id', 'id pesanan',
  'id order', 'id transaksi', 'no transaksi', 'nomor transaksi', 'transaction id',
  'transaction number', 'trx id', 'no invoice', 'nomor invoice', 'invoice id',
  'invoice number', 'no faktur', 'nomor faktur', 'faktur id', 'no resi', 'nomor resi',
  'awb', 'tracking number', 'no airway bill', 'kode pesanan', 'kode order',
  'kode transaksi', 'kode invoice', 'reference id', 'no referensi', 'sub order id',
  'parent order id', 'package id', 'no. pesanan', 'nomer pesanan', 'orderid', 'invoice',
  'pesanan id', 'no pemesanan', 'order id shopee', 'order id tiktok', 'order id tokopedia',
  'order id lazada', 'order id bukalapak', 'invoice no', 'order reference', 'referensi pesanan',
  'id tagihan', 'nomor tagihan', 'total harga', 'harga total', 'grand total', 'total bayar'
])

// --- status (Status Pesanan / Jenis Transaksi) ---
_add('status', [
  'status pesanan', 'status order', 'status transaksi', 'status settlement',
  'status penyelesaian', 'status pengiriman', 'status pembayaran', 'order status',
  'transaction status', 'settlement status', 'delivery status', 'type',
  'transaction type', 'order type', 'jenis transaksi', 'jenis pesanan', 'tipe transaksi',
  'keterangan pesanan', 'keterangan transaksi', 'kondisi pesanan', 'state', 'order state'
])

// --- sku (SKU / Kode Barang / Variasi) ---
_add('sku', [
  'sku', 'seller sku', 'sku induk', 'parent sku', 'sku variasi', 'variation sku',
  'sku referensi', 'nomor referensi sku', 'kode sku', 'kode barang', 'kode produk',
  'kode item', 'kode artikel', 'item code', 'product code', 'article code',
  'merchant sku', 'shop sku', 'lazada sku', 'tiktok sku', 'shopee sku', 'barcode',
  'ean', 'upc', 'kode gudang', 'kodebarang', 'product sku', 'item sku', 'kode varian',
  'variant sku', 'sku id', 'nomor sku', 'sku toko'
])

// --- productName (Nama Produk / Barang) ---
_add('productName', [
  'nama produk', 'judul produk', 'nama barang', 'judul barang', 'nama item',
  'judul item', 'product name', 'item name', 'product title', 'item title',
  'goods name', 'merchandise name', 'nama artikel', 'deskripsi produk',
  'product description', 'nama variasi', 'variation', 'variant name', 'varian',
  'nama menu', 'nama paket', 'namaproduk', 'produk', 'item', 'barang',
  'nama item produk', 'nama barang terjual', 'sku produk', 'barang yang dijual',
  'nama produk shopee', 'nama produk tiktok', 'nama produk tokopedia',
  'nama produk lazada', 'nama produk bukalapak', 'judul barang', 'produk tokopedia'
])

// --- quantity (Kuantitas / Jumlah Terjual) ---
_add('quantity', [
  'jumlah', 'qty', 'quantity', 'kuantitas', 'jumlah terjual', 'qty terjual',
  'unit terjual', 'total terjual', 'barang terjual', 'produk terjual',
  'sold qty', 'quantity sold', 'order qty', 'item qty', 'banyaknya',
  'jumlah barang', 'jumlah produk', 'jumlah item', 'total unit', 'total qty',
  'pcs', 'jumlah pcs', 'jumlah unit', 'pcs terjual', 'jumlah order',
  'jumlah pembelian', 'qty order', 'terjual'
])

// --- productPrice / grossSales (Omzet Kotor / Harga Produk) ---
_add('productPrice', [
  'omzet kotor', 'omzet kotor produk', 'penjualan kotor', 'total penjualan',
  'total penjualan kotor', 'harga asli produk', 'harga jual produk', 'harga satuan',
  'harga produk', 'total harga produk', 'subtotal produk', 'subtotal sebelum diskon',
  'subtotal setelah diskon', 'subtotal pesanan', 'total pembayaran pembeli',
  'total dibayar pembeli', 'nilai pesanan', 'nominal pesanan', 'gross sales',
  'gross revenue', 'total revenue', 'product price', 'unit price', 'item price',
  'selling price', 'original price', 'subtotal before seller discounts',
  'subtotal after seller discounts', 'order amount', 'merchandise subtotal',
  'product subtotal', 'sales amount', 'gross product sales', 'total product sales',
  'unit retail price', 'retail price', 'paid price', 'harga jual', 'price', 'harga',
  'harga jual produk', 'harga jual satuan', 'harga unit', 'harga barang',
  'harga jual barang', 'harga bayar', 'harga pembeli', 'harga penjualan',
  'harga jual satuan produk', 'harga produkn', 'harga asli', 'total harga barang',
  'total harga jual', 'total belanja'
])

// --- settlementAmount (Dana Bersih Cair / Penghasilan) ---
_add('settlementAmount', [
  'total penghasilan', 'penghasilan bersih', 'penghasilan penjual', 'dana cair',
  'dana bersih', 'dana bersih cair', 'total dana cair', 'total dana cair bersih',
  'dana dilepas', 'total dana dilepas', 'dana masuk', 'dana masuk saldo',
  'dana masuk rekening', 'total pencairan', 'nilai pencairan', 'pembayaran bersih',
  'total diterima', 'diterima penjual', 'penerimaan', 'total penerimaan', 'diterima',
  'net sales', 'net revenue', 'net income', 'net profit', 'net settlement',
  'total settlement', 'total settlement amount', 'settlement amount',
  'release amount', 'payout amount', 'net payout', 'remittance', 'net remittance',
  'seller payout', 'final settlement', 'transfer amount', 'net settlement amount',
  'total payout amount', 'pendapatan marketplace', 'pendapatan toko',
  'penghasilan toko', 'total dana diterima', 'jumlah dana', 'dana remit',
  'dana remit seller', 'total remit', 'pencairan dana', 'uang masuk',
  'transfer ke rekening', 'saldo akhir', 'pendapatan akhir', 'pendapatan bersih',
  'pendapatan netto', 'estimated total income', 'est total income', 'total income'
])

// --- shippingBuyer (Ongkir dibayar pembeli) ---
_add('shippingBuyer', [
  'ongkir dibayar pembeli', 'ongkir pembeli', 'biaya kirim dibayar pembeli',
  'ongkos kirim pembeli', 'customer shipping fee', 'buyer shipping fee',
  'shipping fee paid by buyer', 'shipping paid by customer', 'pendapatan ongkir'
])

// --- shippingActual (Ongkir aktual / ditanggung penjual) ---
_add('shippingActual', [
  'ongkir aktual', 'ongkir aktual ekspedisi', 'ongkir ekspedisi', 'ongkir kurir',
  'ongkir sesungguhnya', 'biaya kirim aktual', 'ongkos kirim dibebankan ke penjual',
  'ongkir ditanggung penjual', 'actual shipping fee', 'seller shipping fee',
  'shipping fee paid by seller', 'courier shipping fee', 'est shipping fee'
])

// ---------- 4. Kata kunci potongan/beban (deductionBreakdown) ----------
// Setiap kolom nominal yang mengandung kata kunci ini otomatis masuk ke
// rincian potongan (cost_*) dan TIDAK pernah memicu kotak kuning.
const COST_KEYWORDS = [
  'biaya', 'potongan', 'fee', 'charge', 'komisi', 'commission', 'admin',
  'administrasi', 'layanan', 'service', 'afiliasi', 'affiliate', 'kreator',
  'creator', 'voucher', 'kupon', 'coupon', 'diskon', 'discount', 'subsidi',
  'subsidy', 'promo', 'promosi', 'kampanye', 'campaign', 'cashback', 'koin',
  'coin', 'premi', 'asuransi', 'insurance', 'pajak', 'tax', 'ppn', 'pph', 'vat',
  'transaksi', 'transaction fee', 'payment', 'mdr', 'penalti', 'penalty',
  'denda', 'fine', 'potongan', 'deduction', 'adjustment', 'penyesuaian',
  'iklan', 'ads', 'iklan toko', 'ongkir', 'ongkos', 'kirim', 'pengiriman',
  'retur', 'refund', 'pengembalian', 'cod', 'asuransi transport', 'kurs',
  'transfer', 'penarikan', 'saldo', 'langganan', 'listing', 'featured',
  'boost', 'top ads', 'search ads', 'impor', 'cukai', 'bea', 'gateway',
  'dompet', 'e-wallet', 'bank', 'va', 'kartu kredit', 'cicilan', 'bpnl',
  'shopeepay', 'gopay', 'ovo', 'dana', 'link aja', 'spaylater', 'akulaku',
  'atome', 'reimburse', 'poin', 'reward', 'bonus', 'insentif', 'konsinyasi',
  'deposit', 'penjaminan', 'garansi', 'operasional', 'overhead', 'paket',
  'tambahan', 'lainnya', 'lain-lain'
]

// ---------- 5. Daftar putih metadata non-keuangan ----------
// Diabaikan dari unrecognizedColumns dan tidak pernah memicu kotak kuning.
const METADATA_WHITELIST = [
  'tanggal', 'date', 'waktu', 'time', 'jam', 'created', 'completed', 'paid',
  'shipped', 'kurir', 'courier', 'ekspedisi', 'jasa kirim', 'metode',
  'payment method', 'catatan', 'note', 'remark', 'pembeli', 'buyer',
  'customer', 'username', 'penerima', 'recipient', 'telepon', 'phone', 'hp',
  'kota', 'city', 'provinsi', 'province', 'kecamatan', 'district', 'alamat',
  'address', 'kode pos', 'zip', 'gudang', 'warehouse', 'toko', 'shop', 'store',
  'cabang', 'branch', 'mata uang', 'currency', 'no', 'nomor urut', 'index'
]

// ---------- 5b. Blacklist mutlak kolom non-finansial ----------

const NON_FINANCIAL_KEYWORDS = [
  'waktu', 'tanggal', 'date', 'time', 'created', 'settled', 'completed',
  'paid', 'shipped', 'periode', 'no.', 'nomor', 'id', 'kode', 'code',
  'resi', 'awb', 'sku', 'metode', 'method', 'status', 'type', 'variasi',
  'variation', 'currency', 'mata uang'
];

/**
 * Cek apakah header adalah kolom non-finansial yang harus diblokir
 * dari ekstraksi angka Rupiah dan deductionBreakdown.
 */
function isNonFinancialColumn(header) {
  if (!header) return false
  const h = String(header).toLowerCase()
  return NON_FINANCIAL_KEYWORDS.some(kw => h.includes(kw.toLowerCase()))
}

// ---------- 6. Aturan pola akar kata (root word matching) ----------
const ROOT_RULES = {
  orderId: {
    kind: 'and',
    group1: ['order', 'pesanan', 'transaksi', 'transaction', 'invoice', 'faktur', 'resi', 'awb'],
    group2: ['id', 'no', 'nomor', 'kode', 'code', 'sn', 'number', 'ref'],
    score: 90
  },
  status: {
    kind: 'any',
    words: ['status', 'jenis transaksi', 'tipe transaksi', 'transaction type'],
    score: 90
  },
  sku: {
    kind: 'orCombo',
    alone: ['sku'],
    group1: ['kode', 'code', 'referensi'],
    group2: ['barang', 'produk', 'product', 'item', 'artikel', 'variasi', 'varian'],
    score: 90
  },
  productName: {
    kind: 'and',
    group1: ['produk', 'product', 'barang', 'item', 'goods', 'artikel'],
    group2: ['nama', 'judul', 'name', 'title', 'deskripsi'],
    score: 90
  },
  quantity: {
    kind: 'any',
    words: ['qty', 'quantity', 'kuantitas', 'terjual', 'banyaknya'],
    score: 90
  },
  productPrice: {
    kind: 'any',
    words: ['omzet', 'gross', 'revenue', 'penjualan kotor', 'harga produk',
      'harga jual', 'subtotal produk', 'merchandise subtotal', 'order amount'],
    score: 90
  },
  settlementAmount: {
    kind: 'any',
    words: ['dana cair', 'dana bersih', 'dana dilepas', 'penghasilan', 'pencairan',
      'settlement', 'payout', 'remittance', 'net sales', 'diterima penjual'],
    score: 90
  }
}

/**
 * Evaluasi aturan pola akar kata terhadap teks yang sudah dinormalisasi.
 * Mengembalikan rule.score jika cocok, 0 jika tidak.
 */
function scoreRootRule(text, rule) {
  let matched = false
  if (rule.kind === 'any') {
    matched = rule.words.some(w => text.includes(w))
  } else if (rule.kind === 'and') {
    matched = rule.group1.some(w => text.includes(w)) && rule.group2.some(w => text.includes(w))
  } else if (rule.kind === 'orCombo') {
    matched = rule.alone.some(w => text.includes(w)) ||
      (rule.group1.some(w => text.includes(w)) && rule.group2.some(w => text.includes(w)))
  }
  return matched ? rule.score : 0
}

// ---------- 7. Gabungan kamus semua marketplace ----------
function buildMergedAliases(marketplace = 'auto') {
  // Kamus ALIASES sudah berisi seluruh variasi semua marketplace, sehingga
  // digunakan untuk semua mode (auto maupun spesifik) agar pencocokan
  // lintas marketplace selalu aktif.
  const merged = {}
  for (const [key, list] of Object.entries(ALIASES)) {
    merged[key] = [...list]
  }
  return merged
}

/**
 * Cek apakah header mengandung kata kunci potongan/beban (biaya/fee/dll).
 */
function isCostHeader(header) {
  return COST_KEYWORDS.some(kw => header.includes(kw))
}

/**
 * Cek apakah header termasuk metadata non-keuangan (daftar putih).
 */
function isMetadataHeader(header) {
  const words = header.split(' ')
  for (const kw of METADATA_WHITELIST) {
    if (kw.includes(' ')) {
      if (header.includes(kw)) return true
    } else if (words.includes(kw)) {
      return true
    }
  }
  return false
}

module.exports = {
  PUNCTUATION_RE,
  normalizeHeader,
  normalizeHeaderDeep,
  scoreMatch,
  ALIASES,
  COST_KEYWORDS,
  METADATA_WHITELIST,
  NON_FINANCIAL_KEYWORDS,
  isNonFinancialColumn,
  ROOT_RULES,
  scoreRootRule,
  buildMergedAliases,
  isCostHeader,
  isMetadataHeader
};
