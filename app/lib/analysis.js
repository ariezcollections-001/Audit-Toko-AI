import XLSX from 'xlsx-js-style'
import {
  ALIASES,
  ROOT_RULES,
  METADATA_WHITELIST,
  normalizeHeaderDeep,
  scoreRootRule,
  isCostHeader,
  isMetadataHeader,
  buildMergedAliases
} from './columnAliases'

/* ============================================================================
   SMART HEADER MAPPER - Multi-marketplace column recognition
   ============================================================================ */

const COLUMN_ALIASES = {
  orderId: [
    'order id', 'no. pesanan', 'nomer pesanan', 'nomor pesanan', 'orderid',
    'invoice', 'no invoice', 'order number', 'no order', 'pesanan id', 'id pesanan',
    'no transaksi', 'kode transaksi', 'transaction id', 'transaksi id',
    'nomor order', 'no pemesanan', 'id order', 'order id shopee', 'order id tiktok',
    'order id tokopedia', 'order id lazada', 'order id bukalapak',
    'nomor invoice', 'no invoice', 'invoice number', 'invoice no',
    'order reference', 'referensi pesanan', 'nomor pesanan',
    // Alias Bukalapak (No. Pesanan / Tagihan)
    'id tagihan', 'nomor tagihan',
    // Alias TikTok Shop (Order / Adjustment ID)
    'adjustment id', 'order adjustment id', 'order/adjustment id'
  ],
  productName: [
    'product name', 'nama produk', 'namaproduk', 'produk', 'item name',
    'nama item', 'product', 'nama barang', 'barang',
    'nama item produk', 'nama produk shopee', 'nama produk tiktok',
    'nama produk tokopedia', 'nama produk lazada', 'nama produk bukalapak',
    'barang yang dijual', 'nama barang terjual', 'sku produk', 'item',
    'product title', 'judul produk', 'deskripsi produk',
    // Alias Bukalapak (Nama Produk)
    'judul barang', 'nama barang',
    // Alias TikTok Shop (Nama Produk)
    'variation'
  ],
  sku: [
    'sku', 'kode produk', 'kodebarang', 'product sku', 'item sku',
    'kode barang', 'kode item', 'kode sku', 'seller sku', 'variant sku',
    'kode varian', 'product code', 'kode produk shopee', 'kode produk tiktok',
    'kode produk tokopedia', 'kode produk lazada', 'kode produk bukalapak',
    'barcode', 'kode batang', 'ean', 'upc',
    // Alias TikTok Shop (SKU Reference)
    'sku reference', 'sku id'
  ],
  settlementAmount: [
    'settlement amount', 'total penghasilan', 'totalpendapatan',
    'pendapatan total', 'amount', 'total amount', 'net amount',
    'total receive', 'total diterima', 'jumlah diterima',
    'net payout', 'pendapatan bersih', 'pendapatan netto', 'payout',
    'total payout', 'pendapatan akhir', 'saldo akhir',
    'estimasi total penghasilan', 'estimated total income', 'est total income',
    'total income', 'pendapatan bersih akhir', 'saldo tersedia', 'dana cair', 'dana tersedia',
    'total dana diterima', 'jumlah dana', 'total settlement', 'settlement',
    'payout amount', 'net settlement', 'total payout amount',
    'pendapatan marketplace', 'pendapatan toko', 'penghasilan toko',
    // Alias bahasa Inggris TikTok Shop (Dana Bersih Cair / Net Payout)
    'net settlement amount', 'total settlement amount', 'net settlement',
    'dana masuk rekening', 'dana masuk', 'uang masuk', 'transfer ke rekening',
    // Alias Bukalapak (Dana Remit / Pencairan)
    'dana remit', 'dana remit seller', 'total remit', 'pencairan dana'
  ],
  shippingFee: [
    'shipping fee', 'ongkir', 'biaya kirim', 'ongkos kirim',
    'biaya pengiriman', 'shipping', 'ongkos delivery', 'biaya ongkir',
    'subsidi ongkir', 'voucher ongkir', 'ongkir subsidi',
    'ongkos kirim pembeli', 'ongkir pembeli', 'biaya kirim pembeli',
    'ongkos dikurir', 'biaya dikurir', 'shipping charged', 'ongkir dibebankan',
    'biaya pengiriman pembeli', 'ongkir jasa kirim', 'biaya ongkir kurir',
    'ongkir dikurir', 'ongkos kurir', 'biaya kurir', 'ongkir ekspedisi',
    'biaya ekspedisi', 'ongkir logistic', 'biaya logistic'
  ],
  platformCommission: [
    'platform commission', 'biaya administrasi', 'biaya admin',
    'admin fee', 'commission', 'platform fee', 'biaya platform',
    'biaya jasa', 'jasa penjualan', 'biaya layanan', 'biaya layanan termasuk ppn',
    'layanan', 'biaya service', 'biaya komisi platform', 'komisi platform',
    'biaya komisi shopee', 'komisi shopee', 'biaya komisi tiktok',
    'komisi tiktok', 'biaya komisi tokopedia', 'komisi tokopedia',
    'biaya komisi lazada', 'komisi lazada', 'biaya komisi bukalapak',
    'komisi bukalapak', 'fee platform', 'marketplace fee', 'biaya marketplace',
    'biaya jasa platform', 'potongan platform', 'potongan komisi',
    'biaya admin marketplace', 'admin marketplace', 'biaya transaksi platform',
    // Alias Bukalapak (Potongan Marketplace)
    'potongan super seller', 'biaya super seller',
    // Alias TikTok Shop (Potongan Marketplace)
    'platform commission tiktok', 'seller shipping fee', 'customer shipping fee', 'service fee tiktok'
  ],
  affiliateCommission: [
    'affiliate commission', 'komisi afiliasi', 'affiliate fee',
    'biaya afiliasi', 'komisi influencer', 'biaya influencer',
    'komisi mitra', 'biaya mitra', 'komisi reseller', 'biaya reseller'
  ],
  // --- Kolom harga jual produk dari file Excel pelanggan ---
  // Sumber utama "Total Omzet Kotor" (grossSales): kolom subtotal baris
  // ('Total Harga Produk' / 'Subtotal Produk'; harga per pcs = total / qty).
  // CATATAN: 'total penghasilan' / 'penghasilan' SENGaja JANGAN dimasukkan di sini â€”
  // kolom penghasilan hanya boleh milik settlementAmount (netPayout / Total Dana Bersih Cair),
  // agar Total Omzet Kotor tidak ikut mengambil nilai Total Penghasilan.
  productPrice: [
    'total harga produk', 'subtotal produk',
    'harga asli produk', 'product price', 'harga jual', 'price',
    'harga', 'unit price', 'harga satuan', 'harga produk',
    'harga jual produk', 'harga jual satuan', 'harga unit', 'harga barang',
    'harga jual barang', 'paid price', 'harga bayar', 'harga pembeli',
    'harga penjualan', 'harga jual satuan produk', 'price per unit',
    'harga jual per unit', 'harga produkn', 'original price', 'harga asli',
    // Alias bahasa Inggris TikTok Shop (kolom total baris / harga satuan produk)
    'gross product sales', 'total product sales',
    'unit retail price', 'retail price',
    // Alias Bukalapak (Omzet Kotor / Harga Barang)
    'total harga barang',
    // Alias TikTok Shop (Omzet Kotor / Gross Revenue)
    'total revenue', 'subtotal before seller discounts', 'subtotal after seller discounts', 'gross sales', 'order amount'
  ],
  quantity: [
    'quantity', 'qty', 'jumlah', 'jumlah terjual', 'terjual',
    'jumlah produk', 'qty terjual', 'jumlah unit', 'jumlah pcs',
    'jumlah barang', 'pcs terjual', 'kuantitas', 'jumlah order',
    'jumlah item', 'jumlah pembelian', 'qty order'
  ],
  productWeight: [
    'product weight', 'berat produk', 'berat', 'weight',
    'berat barang', 'gram'
  ],
  shippingEstimate: [
    'estimasi ongkir', 'estimated shipping', 'shipping estimate',
    'estimated shipping cost', 'ongkir estimasi',
    'estimasi biaya kirim', 'estimasi ongkos kirim',
    'shipping estimate cost', 'ongkir estimasi shopee'
  ],
  buyerShipping: [
    'ongkir dibayar pembeli', 'buyer shipping', 'shipping paid by buyer',
    'ongkir pembeli', 'ongkir dibayar customer', 'biaya kirim pembeli',
    'ongkos kirim dibeli', 'shipping paid customer', 'ongkir customer'
  ],
  resi: [
    'resi', 'no resi', 'nomor resi', 'tracking number', 'tracking no',
    'nomor pengiriman', 'awb', 'nomor tracking', 'tracking id',
    'nomor resi shopee', 'resi tiktok', 'resi tokopedia', 'resi lazada',
    'resi bukalapak', 'no resi pengiriman', 'nomor resi pengiriman'
  ],
  voucher: [
    'voucher', 'voucher diskon', 'diskon voucher', 'potongan voucher',
    'kode voucher', 'promo', 'potongan promo', 'potongan voucher shopee',
    'voucher shopee', 'voucher tiktok', 'voucher tokopedia', 'voucher lazada',
    'voucher bukalapak', 'diskon promo', 'kode promo', 'potongan diskon',
    'diskon voucher pembeli', 'voucher pembeli',
    // Alias Bukalapak (Voucher Lapak)
    'voucher lapak'
  ],
  subsidi: [
    'subsidi', 'subsidi ongkir', 'subsidi biaya kirim', 'bantuan ongkir',
    'subsidi shopee', 'subsidi tiktok', 'subsidi tokopedia', 'subsidi lazada',
    'subsidi bukalapak', 'bantuan biaya kirim', 'subsidi pengiriman'
  ],
  // --- Alias Biaya Shopee Terbaru ---
  orderProcessFee: [
    'biaya proses pesanan', 'order process fee', 'biaya proses order',
    'biaya proses pesanan shopee', 'order processing fee'
  ],
  adjustmentFee: [
    'biaya penyesuaian', 'biaya penyesuaian pesanan', 'order adjustment',
    'penyesuaian', 'adjustment fee', 'biaya koreksi',
    'biaya penyesuaian order', 'koreksi pesanan', 'adjustment pesanan'
  ],
  sellerDiscount: [
    'diskon penjual', 'diskon seller', 'promo penjual',
    'diskon penjual shopee', 'seller discount', 'potongan penjual'
  ],
  promoServiceFee: [
    'biaya layanan promo xtra', 'promo xtra service fee', 'biaya layanan promo',
    'biaya layanan xtra', 'biaya layanan xtra shopee', 'promo xtra shopee'
  ],
  // --- Kolom potongan Shopee baru ---
  platformFee: [
    'biaya platform', 'platform fee', 'platform fee shopee',
    'biaya platform shopee', 'biaya platform marketplace'
  ],
  freeShippingXtra: [
    'biaya gratis Ongkir XTRA', 'biaya gratis ongkir xtra', 'gratis ongoing xtra',
    'biaya gratis ongkir', 'free shipping xtra', 'ongkir gratis xtra',
    'biaya gratis ongkir shopee', 'biaya gratis kirim xtra'
  ],
  serviceFee: [
    'biaya layanan', 'biaya jasa', 'service fee',
    'biaya layanan shopee', 'service fee shopee', 'biaya jasa shopee'
  ],
  promoFee: [
    'biaya promosi', 'biaya promo', 'promo fee',
    'biaya promosi shopee', 'promo fee shopee', 'biaya iklan promosi',
    // Alias Bukalapak (Biaya Fitur Promosi)
    'biaya fitur promosi'
  ],
  otherFee: [
    'biaya lainnya', 'biaya lain-lain', 'other fee',
    'biaya lain', 'biaya tambahan lainnya', 'miscellaneous fee'
  ],
  adminFee: [
    'biaya administrasi', 'biaya admin', 'admin fee',
    'biaya administrasi shopee', 'admin fee shopee', 'biaya admin marketplace',
    // Alias Bukalapak (Biaya Admin Transaksi)
    'biaya admin transaksi'
  ],
  shippingDifference: [
    'selisih ongkir', 'selisih Ongkir', 'shipping difference',
    'selisih biaya kirim', 'selisih ongkos kirim', 'shipping diff',
    'selisih ongkir shopee', 'perbedaan ongkir'
  ],
  shippingRevenue: [
    'pendapatan ongkir', 'ongkir pendapatan', 'pendapatan pengiriman',
    'shipping revenue', 'shipping income', 'pendapatan ongkos kirim',
    'biaya kirim dibebankan pembeli'
  ],
  shippingBorneBySeller: [
    'ongkir ditanggung penjual', 'ongkir dibebankan penjual',
    'biaya ongkir ditanggung penjual', 'ongkir penjual ditanggung',
    'shipping borne by seller', 'seller shipping burden', 'ongkir tanggung penjual'
  ],
  shippingActualCourier: [
    'ongkir aktual ekspedisi', 'ongkir aktual kurir', 'ongkir aktual',
    'biaya ongkir aktual', 'actual shipping courier', 'actual shipping cost',
    'biaya kirim aktual', 'biaya aktual ekspedisi'
  ],
  shippingFeeDiscrepancy: [
    'shipping fee discrepancy', 'selisih ongkir pembelian',
    'perbedaan ongkir pembelian', 'shipping fee diff'
  ],
  amsCommission: [
    'biaya komisi ams', 'ams commission', 'komisi ams',
    'biaya ams', 'komisi iklan shopee', 'biaya iklan shopee'
  ],
  shippingSavingProgram: [
    'biaya program hemat biaya kirim', 'shipping saving program',
    'program hemat ongkir', 'hemat biaya kirim',
    'program hemat ongkir shopee', 'biaya program hemat ongkir'
  ],
  refund: [
    'refund', 'pengembalian dana', 'nominal pengembalian dana', 'jumlah pengembalian dana',
    'pengembalian', 'biaya retur', 'retur', 'return', 'total pengembalian',
    'pengembalian dana pembeli', 'biaya pengembalian', 'nominal retur', 'jumlah retur',
    'refund pembeli', 'total refund', 'pengembalian uang'
  ],
  orderStatus: [
    'order status', 'order_status', 'type', 'order type', 'status pesanan', 'status',
    'jenis pesanan', 'order status shopee', 'order status tiktok',
    // Alias TikTok Shop (Transaction / Order Type)
    'transaction type'
  ],
  // --- Kolom biaya potongan dari file Excel pelanggan ---
  transactionFee: [
    'biaya transaksi', 'biaya transaksi resmi', 'fee transaksi',
    'biaya transaksi shopee', 'transaction fee shopee', 'biaya transaksi marketplace',
    // Alias bahasa Inggris TikTok Shop
    'transaction fee', 'transaction fee tiktok'
  ],
  premium: [
    'premi', 'biaya premi', 'asuransi premi',
    'biaya asuransi', 'premi asuransi', 'asuransi pengiriman'
  ],
  tax: [
    'pajak', 'pph 22', 'pajak penghasilan', 'tax',
    'ppn', 'pajak pertambahan nilai', 'biaya pajak', 'pajak transaksi',
    // Alias bahasa Inggris TikTok Shop
    'tax amount', 'vat'
  ],
  additionalServiceFee: [
    'biaya layanan tambahan', 'additional service fee', 'biaya tambahan',
    'biaya layanan tambahan shopee', 'additional service fee shopee'
  ],
  estimatedTotalIncome: [
    'estimasi total penghasilan', 'estimated total income', 'est total income'
  ],
  shippingDeduction: [
    'potongan ongkos kirim dari shopee', 'shipping deduction', 'potongan ongkir shopee',
    'deduksi ongkir', 'ongkir ditanggung shopee', 'potongan ongkir',
    // Alias bahasa Inggris TikTok Shop (Potongan Ongkir)
    'shipping fee deduction'
  ],
  shippingPaidToCourier: [
    'ongkos kirim yang dibayarkan ke jasa kirim', 'shipping paid to courier',
    'biaya kirim ke kurir', 'ongkir dikurir', 'biaya pengiriman ke kurir',
    'ongkos dikurir', 'biaya jasa kirim', 'biaya kurir'
  ],
  discount: [
    'diskon', 'discount', 'potongan diskon', 'diskon produk',
    'diskon penjualan', 'potongan harga', 'price discount',
    'harga setelah diskon', 'nominal diskon', 'diskon nominal'
  ],
  salesDiscount: [
    'diskon penjual (tambahan)', 'sales discount', 'penjual discount',
    'biaya diskon penjual', 'potongan diskon penjual'
  ],
  commission: [
    'komisi', 'commission', 'biaya komisi', 'potongan komisi',
    'komisi penjualan', 'nominal komisi', 'komisi marketplace'
  ],
  adsFee: [
    'biaya iklan / ads', 'biaya iklan', 'ads fee', 'biaya iklan shopee',
    'biaya iklan tiktok', 'biaya iklan tokopedia', 'biaya iklan lazada',
    'biaya promosi iklan', 'cost per click', 'cpc', 'biaya iklan marketplace'
  ],
  voucherFee: [
    'biaya voucher', 'voucher fee', 'potongan voucher pembeli',
    'biaya potongan voucher', 'nominal voucher', 'biaya kode voucher'
  ],
  shippingSubsidy: [
    'subsidi ongkir', 'ongkir subsidi', 'biaya subsidi ongkir',
    'subsidi ongkos kirim', 'biaya subsidi pengiriman'
  ],
  platformDeduction: [
    'potongan platform', 'platform deduction', 'biaya potongan platform',
    'nominal potongan platform', 'potongan marketplace platform'
  ],
  serviceCharge: [
    'service charge', 'biaya layanan tambahan', 'charge layanan',
    'biaya service charge', 'biaya jasa tambahan'
  ],
  paymentFee: [
    'biaya pembayaran', 'payment fee', 'biaya transaksi pembayaran',
    'biaya pembayaran marketplace', 'biaya pembayaran online', 'biaya metode pembayaran'
  ],
  penaltyFee: [
    'denda', 'penalty', 'biaya denda', 'potongan denda',
    'denda keterlambatan', 'denda pelanggaran', 'biaya penalti'
  ],
  codFee: [
    'biaya cod', 'cod fee', 'biaya pembayaran cod',
    'biaya cash on delivery', 'ongkir cod', 'biaya cod pembeli'
  ],
  insuranceFee: [
    'biaya asuransi', 'insurance fee', 'biaya asuransi pengiriman',
    'asuransi paket', 'biaya asuransi paket'
  ],
  handlingFee: [
    'biaya handling', 'handling fee', 'biaya penanganan',
    'biaya pengemasan', 'packing fee', 'biaya packing'
  ],
  packingFee: [
    'biaya packing', 'packing fee', 'biaya kemasan', 'biaya paket',
    'biaya kemasan produk', 'packing cost', 'biaya pack'
  ],
  warehouseFee: [
    'biaya gudang', 'warehouse fee', 'biaya penyimpanan',
    'biaya storage', 'storage fee', 'biaya gudang marketplace'
  ],
  lateFee: [
    'biaya terlambat', 'late fee', 'biaya keterlambatan',
    'potongan terlambat', 'denda terlambat', 'biaya terlambat pengiriman'
  ],
  reversalFee: [
    'biaya reversi', 'reversal fee', 'potongan reversi',
    'biaya pembatalan', 'cancellation fee', 'potongan pembatalan'
  ],
  chargebackFee: [
    'biaya chargeback', 'chargeback fee', 'potongan chargeback',
    'biaya sengketa', 'dispute fee', 'potongan sengketa'
  ],
  currencyFee: [
    'biaya kurs', 'currency fee', 'biaya konversi mata uang',
    'biaya konversi', 'exchange fee', 'biaya exchange'
  ],
  withdrawalFee: [
    'biaya penarikan', 'withdrawal fee', 'biaya transfer dana',
    'biaya cairkan dana', 'biaya payout', 'biaya penarikan saldo'
  ],
  subscriptionFee: [
    'biaya langganan', 'subscription fee', 'biaya member',
    'biaya membership', 'biaya paket langganan', 'biaya toko langganan'
  ],
  listingFee: [
    'biaya listing', 'listing fee', 'biaya pasang produk',
    'biaya upload produk', 'biaya listing produk', 'biaya daftar produk'
  ],
  featuredFee: [
    'biaya featured', 'featured fee', 'biaya unggulan',
    'biaya produk unggulan', 'biaya promosi unggulan', 'biaya featured produk'
  ],
  boostFee: [
    'biaya boost', 'boost fee', 'biaya boost produk',
    'biaya boosting', 'biaya promosi boost', 'biaya tambahan boost'
  ],
  topAdsFee: [
    'biaya top ads', 'top ads fee', 'biaya top ads shopee',
    'biaya iklan top ads', 'potongan top ads', 'biaya topup ads'
  ],
  searchAdsFee: [
    'biaya search ads', 'search ads fee', 'biaya iklan search',
    'biaya pencarian iklan', 'potongan search ads', 'biaya iklan pencarian'
  ],
  affiliateFee: [
    'biaya afiliasi', 'affiliate fee', 'potongan afiliasi',
    'biaya komisi afiliasi', 'nominal afiliasi', 'biaya mitra afiliasi'
  ],
  influencerFee: [
    'biaya influencer', 'influencer fee', 'potongan influencer',
    'biaya komisi influencer', 'nominal influencer', 'biaya mitra influencer'
  ],
  voucherDiscount: [
    'potongan voucher pembeli', 'voucher discount', 'biaya potongan voucher',
    'nominal voucher pembeli', 'diskon voucher pembeli', 'potongan kode voucher'
  ],
  shippingSubsidyFee: [
    'biaya subsidi ongkir', 'shipping subsidy fee', 'potongan subsidi ongkir',
    'nominal subsidi ongkir', 'biaya subsidi pengiriman pembeli'
  ],
  buyerSubsidy: [
    'subsidi pembeli', 'buyer subsidy', 'potongan subsidi pembeli',
    'biaya subsidi pembeli', 'nominal subsidi pembeli'
  ],
  sellerSubsidy: [
    'subsidi penjual', 'seller subsidy', 'potongan subsidi penjual',
    'biaya subsidi penjual', 'nominal subsidi penjual'
  ],
  voucherReimbursement: [
    'reimburse voucher', 'biaya reimburse voucher', 'potongan reimburse',
    'biaya pengembalian voucher', 'nominal reimburse', 'reimbursement voucher'
  ],
  crossBorderFee: [
    'biaya lintas negara', 'cross border fee', 'biaya impor',
    'biaya bea masuk', 'biaya cukai', 'biaya perpajakan lintas negara'
  ],
  customsFee: [
    'biaya cukai', 'customs fee', 'biaya bea cukai',
    'biaya impor barang', 'biaya perpajakan impor', 'potongan cukai'
  ],
  vatFee: [
    'biaya ppn', 'vat fee', 'biaya pertambahan nilai',
    'potongan ppn', 'biaya pajak ppn', 'nominal ppn'
  ],
  withholdingTax: [
    'biaya pph', 'pph fee', 'biaya pph 22', 'biaya pph 23',
    'potongan pph', 'biaya pajak penghasilan', 'nominal pph'
  ],
  serviceTax: [
    'biaya pajak layanan', 'service tax', 'potongan pajak layanan',
    'biaya ppn layanan', 'biaya pajak jasa', 'nominal pajak layanan'
  ],
  transactionTax: [
    'biaya pajak transaksi', 'transaction tax', 'potongan pajak transaksi',
    'biaya pajak penjualan', 'nominal pajak transaksi'
  ],
  platformTax: [
    'biaya pajak platform', 'platform tax', 'potongan pajak platform',
    'biaya pajak marketplace', 'nominal pajak platform'
  ],
  shippingTax: [
    'biaya pajak ongkir', 'shipping tax', 'potongan pajak ongkir',
    'biaya pajak pengiriman', 'nominal pajak ongkir'
  ],
  paymentGatewayFee: [
    'biaya gateway pembayaran', 'payment gateway fee', 'potongan gateway',
    'biaya pembayaran online', 'nominal gateway', 'biaya payment gateway'
  ],
  walletFee: [
    'biaya dompet digital', 'wallet fee', 'potongan dompet',
    'biaya e-wallet', 'nominal dompet digital', 'biaya dompet elektronik'
  ],
  bankFee: [
    'biaya bank', 'bank fee', 'biaya transfer bank',
    'biaya administrasi bank', 'nominal biaya bank', 'biaya transfer'
  ],
  virtualAccountFee: [
    'biaya va', 'va fee', 'biaya virtual account',
    'potongan va', 'biaya admin va', 'nominal biaya va'
  ],
  creditCardFee: [
    'biaya kartu kredit', 'credit card fee', 'potongan kartu kredit',
    'biaya transaksi kartu kredit', 'nominal kartu kredit'
  ],
  installmentFee: [
    'biaya cicilan', 'installment fee', 'potongan cicilan',
    'biaya kartu kredit cicilan', 'nominal cicilan', 'biaya cicilan pembeli'
  ],
  buyNowPayLaterFee: [
    'biaya bpnl', 'bpnl fee', 'potongan bpnl',
    'biaya bayar nanti', 'nominal bpnl', 'biaya bayar nanti kemudian'
  ],
  shopeePayFee: [
    'biaya shopeepay', 'shopeepay fee', 'potongan shopeepay',
    'biaya dompet shopee', 'nominal shopeepay', 'biaya shopee pay'
  ],
  goPayFee: [
    'biaya gopay', 'gopay fee', 'potongan gopay',
    'biaya dompet gojek', 'nominal gopay', 'biaya go pay'
  ],
  ovoFee: [
    'biaya ovo', 'ovo fee', 'potongan ovo',
    'biaya dompet ovo', 'nominal ovo', 'biaya ovo pay'
  ],
  danaFee: [
    'biaya dana', 'dana fee', 'potongan dana',
    'biaya dompet dana', 'nominal dana', 'biaya dana wallet'
  ],
  linkAjaFee: [
    'biaya link aja', 'link aja fee', 'potongan link aja',
    'biaya dompet link aja', 'nominal link aja', 'biaya link aja pay'
  ],
  shopeePayLaterFee: [
    'biaya spaylater', 'spaylater fee', 'potongan spaylater',
    'biaya bayar nanti shopee', 'nominal spaylater', 'biaya shopee pay later'
  ],
  akulakuFee: [
    'biaya akulaku', 'akulaku fee', 'potongan akulaku',
    'biaya cicilan akulaku', 'nominal akulaku', 'biaya akulaku paylater'
  ],
  atomeFee: [
    'biaya atome', 'atome fee', 'potongan atome',
    'biaya bayar nanti atome', 'nominal atome', 'biaya atome paylater'
  ]
}

function getColumnAliases() {
  return ALIASES
}

// Marketplace-specific column alias mappings (multi-marketplace support)
function getTikTokColumnAliases() {
  return {
    orderId: ['order id', 'order id tiktok', 'no order', 'order details id'],
    productName: ['product name', 'product name tiktok', 'nama produk', 'item name'],
    sku: ['sku', 'seller sku'],
    settlementAmount: ['settlement amount', 'total settlement', 'total pendapatan', 'net settlement amount'],
    shippingFee: ['shipping fee', 'customer shipping fee', 'shipping fee tiktok'],
    platformCommission: ['platform commission', 'platform commission tiktok', 'fee tiktok', 'platform fee'],
    affiliateCommission: ['affiliate commission', 'affiliate tiktok'],
    refund: ['refund', 'refund tiktok'],
    productPrice: ['product price', 'price', 'harga jual tiktok', 'gross product sales', 'total product sales', 'unit retail price', 'retail price'],
    quantity: ['quantity', 'qty'],
    buyerShipping: ['buyer shipping', 'customer shipping fee'],
    resi: ['resi', 'tracking number', 'resi tiktok'],
    orderStatus: ['order status', 'order_status', 'type', 'order type'],
    shippingDeduction: ['shipping deduction', 'shipping fee deduction'],
    transactionFee: ['transaction fee'],
    tax: ['tax amount'],
    sellerDiscount: ['seller discount'],
    platformFee: ['platform fee'],
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
  orderId: ['kode transaksi', 'kode transaksi bukalapak', 'id tagihan', 'nomor tagihan'],
  productName: ['nama barang', 'nama barang bukalapak', 'judul barang'],
  sku: ['sku'],
  settlementAmount: ['total dana diterima', 'dana remit', 'dana remit seller', 'total remit', 'pencairan dana'],
  shippingFee: ['ongkos kirim pembeli', 'ongkos kirim kurir'],
  platformCommission: ['biaya komisi bukalapak', 'biaya komisi', 'potongan super seller', 'biaya super seller'],
  affiliateCommission: [],
  refund: ['refund', 'pengembalian dana'],
  productPrice: ['harga barang', 'total harga barang'],
  quantity: ['jumlah', 'jumlah barang'],
  buyerShipping: ['ongkos kirim pembeli'],
  resi: ['resi', 'tracking number'],
  // Potongan tambahan Bukalapak
  adminFee: ['biaya admin transaksi'],
  promoFee: ['biaya fitur promosi'],
  voucher: ['voucher lapak']
}

const TIKTOK_COLUMN_ALIASES = getTikTokColumnAliases()
const TOKOPEDIA_COLUMN_ALIASES = getTokopediaColumnAliases()
const LAZADA_COLUMN_ALIASES = getLazadaColumnAliases()

const MARKETPLACE_ALIASES = {
  shopee: ALIASES,
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
  return buildMergedAliases(marketplace)
}



export function normalizeHeader(h) {
  // Ubah semua pemisah simbol (_ - . / \) menjadi spasi, lalu collapse spasi ganda
  // menjadi spasi tunggal agar header seperti "Gross_Product_Sales" cocok dengan
  // alias kamus "gross product sales".
  return String(h)
    .trim()
    .toLowerCase()
    .replace(/[_\-.\/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreMatch(header, alias) {
  if (header === alias) return 100
  if (header.includes(alias)) return 85
  if (alias.includes(header)) return 70

  // Word overlap scoring with stemming-lite (remove common suffixes/prefixes)
  const hWords = header.split(' ').filter(Boolean)
  const aWords = alias.split(' ').filter(Boolean)

  // Exact word match overlap
  let overlap = hWords.filter(w => aWords.includes(w)).length
  if (overlap > 0) return 60 + overlap * 5

  // Partial word match (e.g., "ongkir" matches "ongkos-kirim")
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

export function smartMapHeaders(rawHeaders, marketplace = 'auto') {
  const headers = rawHeaders.map(h => String(h).trim())
  const normalizedDeep = headers.map(normalizeHeaderDeep) // { cleanFull, cleanBase, original }
  const mapping = {}
  const usedIndices = new Set()

  // Kamus gabungan seluruh marketplace (auto maupun spesifik) agar deteksi
  // lintas marketplace selalu aktif.
  const aliases = buildMergedAliases(marketplace)

  // Ambang keyakinan untuk kolom wajib (productPrice & settlementAmount).
  // Jika di bawah 80, dianggap tidak yakin â†’ memicu Fallback Manual Mapping.
  const STRICT_CONFIDENCE = 80
  const REQUIRED_COLUMNS = ['productPrice', 'settlementAmount']
  const requiredColumnConfidence = {}

  // ============================================================================
  // FASE 1: Cocokkan setiap kunci kamus terhadap header menggunakan kedua
  // versi normalisasi (cleanFull & cleanBase) + aturan pola akar kata.
  // Kolom yang dikenal mendapatkan skor â‰¥ 85 (alias eksak 100, substring 85,
  // pola akar kata 90), sehingga kotak kuning tidak muncul secara tidak perlu.
  // ============================================================================
  for (const [key, aliasList] of Object.entries(aliases)) {
    let bestScore = 0
    let bestIdx = -1
    for (let i = 0; i < headers.length; i++) {
      if (usedIndices.has(i)) continue
      const { cleanFull, cleanBase } = normalizedDeep[i]

      // Pencocokan alias eksak terhadap kedua versi normalisasi
      for (const a of aliasList) {
        let score = scoreMatch(cleanFull, a)
        const scoreBase = scoreMatch(cleanBase, a)
        if (scoreBase > score) score = scoreBase
        if (score > bestScore) {
          bestScore = score
          bestIdx = i
        }
      }

      // Aturan pola akar kata (root word)
      const rule = ROOT_RULES[key]
      if (rule) {
        const rScore = Math.max(scoreRootRule(cleanFull, rule), scoreRootRule(cleanBase, rule))
        if (rScore > bestScore) {
          bestScore = rScore
          bestIdx = i
        }
      }
    }
    // Kolom wajib ambang 80; kolom lainnya ambang 85 (hanya kolom yang
    // benar-benar dikenal yang di-alias, agar tidak ada pencocokan akak).
    const threshold = REQUIRED_COLUMNS.includes(key) ? STRICT_CONFIDENCE : 85
    if (bestScore >= threshold && bestIdx >= 0) {
      mapping[key] = headers[bestIdx]
      usedIndices.add(bestIdx)
      if (REQUIRED_COLUMNS.includes(key)) {
        requiredColumnConfidence[key] = bestScore
      }
    } else if (REQUIRED_COLUMNS.includes(key)) {
      requiredColumnConfidence[key] = bestScore
    }
  }

  // Kumpulkan nama kolom yang sudah di-alias untuk deduplikasi
  const mappedColumnNames = new Set()
  for (const [key, colName] of Object.entries(mapping)) {
    if (!key.startsWith('cost_') && !key.startsWith('meta_')) {
      mappedColumnNames.add(normalizeHeader(colName))
    }
  }

  // ============================================================================
  // FASE 2: Sisa kolom nominal yang mengandung kata kunci potongan/beban
  // (biaya, fee, komisi, diskon, dll) â†’ masuk ke rincian potongan (cost_*)
  // dan TIDAK pernah memicu kotak kuning.
  // ============================================================================
  for (let i = 0; i < headers.length; i++) {
    if (usedIndices.has(i)) continue
    const header = normalizedDeep[i].cleanFull
    const original = headers[i]

    // Skip jika terlalu mirip dengan kolom yang sudah di-alias (deduplikasi)
    let isDuplicate = false
    for (const mapped of mappedColumnNames) {
      if (header === mapped || header.includes(mapped) || mapped.includes(header)) {
        isDuplicate = true
        break
      }
      const hWords = header.split(' ').filter(Boolean)
      const mWords = mapped.split(' ').filter(Boolean)
      const overlap = hWords.filter(w => mWords.includes(w) && w.length >= 3).length
      if (overlap > 0) { isDuplicate = true; break }
    }
    if (isDuplicate) continue

    if (isCostHeader(header)) {
      mapping[`cost_${i}`] = original
      usedIndices.add(i)
    }
  }

  // ============================================================================
  // FASE 3: Metadata non-keuangan (daftar putih) â†’ meta_*, diabaikan dari
  // unrecognizedColumns dan tidak pernah memicu kotak kuning.
  // ============================================================================
  for (let i = 0; i < headers.length; i++) {
    if (usedIndices.has(i)) continue
    const header = normalizedDeep[i].cleanFull
    if (isMetadataHeader(header)) {
      mapping[`meta_${i}`] = headers[i]
      usedIndices.add(i)
    }
  }

  return { mapping, headers, requiredColumnConfidence }
}

/* ============================================================================
   UNIVERSAL NUMBER PARSER - Anti-error format angka
   ============================================================================ */

/**
 * Parses virtually any number format into a clean Number.
 * Handles:
 *   - "Rp 150.000"       â†’ 150000
 *   - "Rp150.000"        â†’ 150000
 *   - "150.000"          â†’ 150000
 *   - "150,000.00"       â†’ 150000
 *   - "(15.000)"         â†’ -15000   (accounting negative)
 *   - "-15000"           â†’ -15000
 *   - "150000"           â†’ 150000
 *   - null / undefined / "" â†’ 0
 *   - Anything else      â†’ 0 (never NaN)
 */
export function parseNumberUniversal(val) {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val

  const s = String(val).trim()
  if (s === '') return 0

  // Detect accounting-style negative: (15.000) â†’ -15000
  let isNegative = /^\(\s*[\d.,]+\s*\)$/.test(s)

  // Remove all non-numeric chars except digits, comma, dot, minus
  let cleaned = s.replace(/[^0-9.,-]/g, '')

  // If accounting format detected, ensure negative sign
  if (isNegative && !cleaned.startsWith('-')) {
    cleaned = '-' + cleaned
  }

  // Indonesian format: "150.000" â†’ thousand separator dot
  // US format: "150,000.00" â†’ comma thousand, dot decimal
  // Strategy: remove dots (thousand sep), replace comma with dot (decimal)
  const hasDot = cleaned.includes('.')
  const hasComma = cleaned.includes(',')

  if (hasDot && hasComma) {
    // "1.234,56" (EU/ID) or "1,234.56" (US)
    // If last comma is after last dot â†’ EU/ID: 1.234,56
    // If last dot is after last comma â†’ US: 1,234.56
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
    // Heuristic: if dot is followed by exactly 2 digits at end â†’ decimal
    // Otherwise â†’ thousand separator, remove dots
    const parts = cleaned.split('.')
    if (parts.length === 2 && parts[1].length === 2 && parts[0].length <= 3) {
      // Likely decimal like "150.00"
      cleaned = parts.join('.')
    } else {
      // Thousand separator like "150.000" or "1.234.567"
      cleaned = cleaned.replace(/\./g, '')
    }
  } else if (hasComma && !hasDot) {
    // "150,000" â†’ could be thousand (US) or decimal (EU)
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

/**
 * Kolom yang nilainya SUDAH merupakan total untuk seluruh qty pada satu baris pesanan
 * (contoh: Total Harga Produk, Subtotal Produk, Total Pembayaran). Nilai di kolom ini
 * JANGAN boleh dikalikan qty/Jumlah lagi â€” ambil nominal baris apa adanya.
 * Hanya kolom harga SATUAN (Harga Produk / Harga Satuan) yang baru dikalikan qty untuk
 * mendapatkan total baris.
 */
const ROW_TOTAL_KEYWORDS = [
  'total harga produk', 'totalproduk', 'subtotal produk', 'subtotal', 'sub total',
  'total pembayaran', 'total tagihan', 'total harga', 'total penjualan',
  'total bayar', 'grand total', 'jumlah total', 'total pembeli', 'total harga jual', 'harga total',
  // Alias bahasa Inggris TikTok Shop (kolom total baris, jangan dikalikan qty)
  'gross product sales', 'total product sales', 'gross sales', 'total sales'
]

function isRowTotalPriceColumn(colName) {
  if (!colName) return false
  const h = normalizeHeader(colName)
  return ROW_TOTAL_KEYWORDS.some(kw => h === kw || h.includes(kw) || kw.includes(h))
}

/** 
 * Klasifikasi status pesanan berdasarkan teks status.
 * Mengembalikan: 'cancelled' | 'returned' | 'valid'
 */
function classifyOrderStatus(statusStr) {
  if (!statusStr) return 'valid'
  const s = String(statusStr).toLowerCase()
  const cancelledWords = ['batal', 'dibatalkan', 'cancel', 'cancelled', 'void', 'failed', 'gagal', 'expired']
  const returnedWords = ['retur', 'return', 'returned', 'pengembalian', 'refund', 'refunded', 'dikembalikan', 'komplain', 'dispute']
  if (cancelledWords.some(w => s.includes(w))) return 'cancelled'
  if (returnedWords.some(w => s.includes(w))) return 'returned'
  return 'valid'
}

export function calculateAnalysis(rows, mapping, hppInputs = {}, marketplace = 'auto', targetProfit = DEFAULT_TARGET_PROFIT, packingCost = 0, adCost = 0) {
  const products = {}
  const claims = []
  const returnedOrders = []
  // Order ID â†’ selisih ongkir pertama (untuk deduplikasi ongkir tingkat order yang di-duplikasi di semua baris produk)
  const shippingDiffByOrderId = new Map()
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
    { key: 'paymentFee', label: 'Biaya Pembayaran' },
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
    // Fallback pencarian nama header asli secara case-insensitive
    // (mis. header Excel 'Jumlah' tetap ditemukan oleh alias 'jumlah';
    // 'Total Harga Produk' tetap ditemukan oleh alias 'total harga produk')).
    const rowKeyByLower = {}
    for (const rk of Object.keys(row)) rowKeyByLower[String(rk).toLowerCase()] = rk
    for (const fb of fallbackKeys) {
      const actualKey = row[fb] !== undefined ? fb : rowKeyByLower[String(fb).toLowerCase()]
      if (actualKey && row[actualKey] !== undefined && row[actualKey] !== '') {
        return toNumber(row[actualKey])
      }
    }
    // Fallback: indir semua header baris terhadap kamus alias untuk kunci ini,
    // agar nilai tetap terbaca meskipun pemetaan otomatis melewatkan kolom
    // (mis. karena perbedaan pemisah simbol atau nama properti yang tidak persis).
    const aliases = ALIASES[key] || []
    const normAliases = aliases.map(a => normalizeHeader(a))
    for (const h of Object.keys(row)) {
      if (normAliases.includes(normalizeHeader(h))) {
        return toNumber(row[h])
      }
    }
    // Emergency fallback: baca langsung kolom TikTok Shop utama berdasarkan
    // nama asli (termasuk variasi pemisah _ / spasi) agar Gross_Product_Sales
    // dan Net_Settlement_Amount selalu terbaca walaupun smartMapHeaders gagal.
    const emergencyCols = {
      productPrice: ['Gross_Product_Sales', 'Gross Product Sales', 'gross_product_sales', 'gross product sales'],
      settlementAmount: ['Net_Settlement_Amount', 'Net Settlement Amount', 'net_settlement_amount', 'net settlement amount']
    }
    if (emergencyCols[key]) {
      // Cek exact key match terlebih dahulu
      for (const ec of emergencyCols[key]) {
        if (row[ec] !== undefined && row[ec] !== '') {
          return toNumber(row[ec])
        }
      }
      // Fallback: normalized header comparison untuk menangani variasi pemisah
      const normEmergency = emergencyCols[key].map(e => normalizeHeader(e))
      for (const h of Object.keys(row)) {
        if (normEmergency.includes(normalizeHeader(h))) {
          return toNumber(row[h])
        }
      }
    }
    return 0
  }
  const getStr = (row, key, fallbackKeys = []) => {
    const mappedKey = mapping[key]
    if (mappedKey && row[mappedKey] !== undefined && row[mappedKey] !== '') {
      return String(row[mappedKey]).trim()
    }
    const rowKeyByLower = {}
    for (const rk of Object.keys(row)) rowKeyByLower[String(rk).toLowerCase()] = rk
    for (const fb of fallbackKeys) {
      const actualKey = row[fb] !== undefined ? fb : rowKeyByLower[String(fb).toLowerCase()]
      if (actualKey && row[actualKey] !== undefined && row[actualKey] !== '') {
        return String(row[actualKey]).trim()
      }
    }
    return ''
  }

  // Deteksi apakah file Excel memiliki kolom No. Pesanan / Order ID yang nyata
  const hasOrderIdColumn = !!mapping.orderId

  // Hitung jumlah produk unik per orderId untuk alokasi proporsional biaya packing
  const orderProductCounts = {}
  // Counter untuk urutan asli kemunculan produk (fixed order di tabel)
  let originalIndexCounter = 0
  // Akumulator total selisih ongkir beban penjual (seluruh variasi kolom)
  let summaryShippingDiffTotal = 0

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

  // Track orderId yang sudah memiliki grossRevenue (omzet kotor) terhitung
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]
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
    // Prioritas ambil dari 'Total Harga Produk' / 'Subtotal Produk' (grossSales),
    // lalu baru harga satuan ('Harga Produk' / 'Harga Jual' dst).
    const productPrice = get(row, 'productPrice', ['Total Harga Produk', 'Subtotal Produk', 'Harga Asli Produk', 'Harga Produk', 'Harga Jual Produk', 'Harga Jual', 'product price', 'price', 'harga jual'])
    // 'jumlah' (exact) selain 'jumlah produk' dan 'qty' â€” pencarian case-insensitive
    // di atas memastikan kolom 'Jumlah' dari Excel selalu terbaca.
    const qty = get(row, 'quantity', ['Quantity', 'qty', 'jumlah', 'jumlah produk', 'qty terjual', 'jumlah pcs']) || 1
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
    const shippingRevenue = get(row, 'shippingRevenue', ['Pendapatan Ongkir', 'ongkir pendapatan', 'shipping revenue', 'pendapatan ongkos kirim'])
    const shippingBorneBySeller = get(row, 'shippingBorneBySeller', ['Ongkir Ditanggung Penjual', 'ongkir ditanggung penjual', 'shipping borne by seller', 'ongkir tanggung penjual'])
    const shippingActualCourier = get(row, 'shippingActualCourier', ['Ongkir Aktual Ekspedisi', 'ongkir aktual ekspedisi', 'actual shipping courier', 'ongkir aktual'])
    const shippingFeeDiscrepancy = get(row, 'shippingFeeDiscrepancy', ['Shipping Fee Discrepancy', 'selisih ongkir pembelian', 'perbedaan ongkir pembelian', 'shipping fee diff'])
    const shippingDifference = get(row, 'shippingDifference', ['Selisih Ongkir', 'selisih Ongkir', 'shipping difference', 'selisih biaya kirim', 'selisih ongkos kirim', 'shipping diff', 'selisih ongkir shopee', 'perbedaan ongkir'])

    // --- Anti-error: pastikan semua nilai angka aman (tidak NaN/Infinity) ---
    const safeSettlement = isFinite(settlement) ? settlement : 0
    const safeShippingFee = isFinite(shippingFee) ? shippingFee : 0
    const safePlatformComm = isFinite(platformComm) ? platformComm : 0
    const safeAffiliateComm = isFinite(affiliateComm) ? affiliateComm : 0
    const safeProductPrice = isFinite(productPrice) ? productPrice : 0
    const safeQty = isFinite(qty) && qty > 0 ? qty : 0
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
    const safeShippingRevenue = isFinite(shippingRevenue) ? shippingRevenue : 0
    const safeShippingBorneBySeller = isFinite(shippingBorneBySeller) ? shippingBorneBySeller : 0
    const safeShippingActualCourier = isFinite(shippingActualCourier) ? shippingActualCourier : 0
    const safeShippingFeeDiscrepancy = isFinite(shippingFeeDiscrepancy) ? shippingFeeDiscrepancy : 0
    const safeShippingDifference = isFinite(shippingDifference) ? shippingDifference : 0

    let extraCosts = 0
    for (const [key, colName] of Object.entries(mapping)) {
      if (key.startsWith('cost_')) {
        const v = toNumber(row[colName])
        extraCosts += isFinite(v) ? v : 0
      }
    }
    const safeExtraCosts = isFinite(extraCosts) ? extraCosts : 0

    // =========================================================================
    // FILTER STATUS PALING AWAL â€” sebelum perhitungan totalGrossSales dan produk
    // =========================================================================
    // Deteksi status pesanan dari kolom Status / Status Settlement
    const orderStatus = getStr(row, 'status', ['Status Pesanan', 'status', 'status pesanan', 'order status', 'order_status', 'Status Settlement', 'status settlement'])
    const statusClass = classifyOrderStatus(orderStatus)

    // Status BATAL â†’ abaikan sepenuhnya: tidak dihitung omzet, dana cair, maupun produk
    if (statusClass === 'cancelled') {
      continue
    }

    // Status RETUR / REFUND â†’ masukkan HANYA ke ringkasan Pesanan Retur, lalu skip
    if (statusClass === 'returned' || safeRefund > 0) {
      const usedDeductionCols = new Set()
      let lostFeeAmount = 0
      deductionColumns.forEach((dc) => {
        if (dc.key === 'refund') return
        const actualCol = findActualDeductionColumn(dc.key, ALIASES[dc.key] || [])
        if (!actualCol || usedDeductionCols.has(actualCol)) return
        usedDeductionCols.add(actualCol)
        const val = toNumber(row[actualCol] || 0)
        if (val !== 0) lostFeeAmount += Math.abs(val)
      })
      // Nominal settlement negatif = biaya hangus / kembali ongkir ditanggung penjual
      if (safeSettlement < 0) {
        lostFeeAmount += Math.abs(safeSettlement)
      }
      returnedOrders.push({
        orderId: orderId || '-',
        productName: productNameRaw,
        sku: sku || '-',
        qty: safeQty,
        productPrice: safeProductPrice,
        refundAmount: safeRefund,
        lostFeeAmount: lostFeeAmount,
      })
      totalRefundCosts += lostFeeAmount
      continue // Jangan masukkan baris retur ke tabel produk sukses
    }

    // Semua biaya potongan Shopee baru dimasukkan ke total deductions
    const totalDeductions = safePlatformComm + safeAffiliateComm + safeExtraCosts
      + safeOrderProcessFee + safePromoServiceFee + safeAmsCommission
      + safeShippingSavingProgram + safePremium + safeTax + safeAdditionalServiceFee

    // Total Penghasilan (settlementAmount) sudah merupakan nilai bersih (net) setelah
    // semua potongan marketplace. Jangan kurangi totalDeductions lagi â€” hanya kurangi refund.
    const netSettlement = safeSettlement - safeRefund
    const units = Math.max(safeQty, 1)
    // --- Tentukan apakah harga produk yang terbaca adalah TOTAL BARIS (sudah untuk seluruh qty)
    // atau HARGA SATUAN (per pcs). Kolom total baris (Total Harga Produk, Subtotal Produk,
    // Total Pembayaran, dll.) SUDAH merupakan jumlah untuk seluruh qty pada baris tersebut â€”
    // JANGAN dikalikan qty lagi. Hanya kalikan qty apabila kolomnya adalah harga satuan
    // (Harga Produk / Harga Satuan) dan file TIDAK memiliki kolom total baris.
    //
    // Prioritaskan kolom total jika tersedia di baris, sehingga meskipun mapping.productPrice
    // menunjuk ke kolom satuan namun ada kolom total terpisah, nilai totallah yang digunakan.
    const rowKeyByLower = {}
    for (const rk of Object.keys(row)) rowKeyByLower[normalizeHeader(rk)] = rk
    const rowGet = (name) => {
      const rk = rowKeyByLower[String(name).toLowerCase()]
      return rk !== undefined ? row[rk] : undefined
    }
    const totalPriceFallbackCols = [
      'Total Harga Produk', 'Subtotal Produk', 'Total Pembayaran', 'Total Tagihan',
      'Total Harga', 'Total Penjualan', 'Total Bayar', 'Grand Total', 'Jumlah Total',
      'Subtotal', 'Total Produk', 'Total Harga Jual', 'Harga Total',
      // Alias bahasa Inggris TikTok Shop (kolom total baris)
      'Gross Product Sales', 'Total Product Sales', 'Gross Sales', 'Total Sales'
    ]
    let priceSourceCol = null
    for (const c of totalPriceFallbackCols) {
      if (rowGet(c) !== undefined && rowGet(c) !== '') { priceSourceCol = c; break }
    }
    // Jika tidak ada kolom total terdeteksi, gunakan kolom yang dipetakan ke productPrice
    if (!priceSourceCol && mapping.productPrice &&
        rowGet(mapping.productPrice) !== undefined && rowGet(mapping.productPrice) !== '') {
      priceSourceCol = mapping.productPrice
    }
    const isTotalPriceCol = priceSourceCol ? isRowTotalPriceColumn(priceSourceCol) : false
    const effectiveProductPrice = priceSourceCol ? toNumber(rowGet(priceSourceCol) || 0) : safeProductPrice
    const safeEffectiveProductPrice = isFinite(effectiveProductPrice) ? effectiveProductPrice : 0

    let rowGrossRevenue
    let pricePerUnit
    if (isTotalPriceCol && safeEffectiveProductPrice > 0) {
      // Kolom total baris: ambil nominal baris langsung (tidak dikalikan qty)
      rowGrossRevenue = safeEffectiveProductPrice
      pricePerUnit = safeQty > 0 ? safeEffectiveProductPrice / safeQty : safeEffectiveProductPrice
    } else if (safeEffectiveProductPrice > 0) {
      // Kolom harga satuan (dan tidak ada kolom total baris): kalikan dengan qty
      rowGrossRevenue = safeEffectiveProductPrice * safeQty
      pricePerUnit = safeEffectiveProductPrice
    } else {
      // Fallback ke settlement jika tidak ada kolom harga produk
      rowGrossRevenue = (safeSettlement / units) * safeQty
      pricePerUnit = safeSettlement / units
    }

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
    const productKey = productNameRaw.toLowerCase().replace(/\s+/g, ' ')

    // Deteksi offset ongkir: jika Potongan Ongkos Kirim dari Shopee
    // sudah menutupi Ongkos Kirim yang Dibayarkan ke Jasa Kirim,
    // subtotal ongkir Rp0 â†’ tidak dianggap kerugian ongkir penjual.
    const netShippingCost = safeShippingFee + safeShippingPaidToCourier - safeShippingDeduction
    const shippingOffset = Math.abs(netShippingCost) < 1000 // toleransi Rp1.000

    // Klaim selisih ongkir (hanya jika estShipping melebihi buyerShipping secara signifikan
    // DAN tidak ada offset ongkir yang menutup biaya)
    if (!shippingOffset && safeEstShipping > 0 && safeBuyerShipping >= 0 && safeEstShipping > safeBuyerShipping + 5000) {
      claims.push({
        orderId: orderId || `ORD-${Date.now()}`, product: productNameRaw, sku,
        resi: resi || '-', paidShipping: safeBuyerShipping, estimatedShipping: safeEstShipping,
        difference: safeEstShipping - safeBuyerShipping,
      })
    }

    // --- Deteksi Selisih Ongkir Bersih per Baris Pesanan (hanya baris sukses) ---
    // selisihOngkir = Math.max(0, |shippingActual| - |shippingBuyer|)
    // Hanya hitung jika selisihOngkir > 0 (beban penjual nyata, tidak impas)
    const shippingBuyer = safeShippingRevenue || safeBuyerShipping
    const shippingActual = safeShippingBorneBySeller || safeShippingActualCourier || safeShippingPaidToCourier
    const selisihOngkir = Math.max(0, Math.abs(shippingActual || 0) - Math.abs(shippingBuyer || 0))

    // Simpan ke properti produk untuk referensi Sheet 2 / detail
    const pForDiff = products[productKey]
    if (pForDiff && selisihOngkir !== 0) {
      pForDiff.shippingDiff = (pForDiff.shippingDiff || 0) + selisihOngkir
    }

    // Deduplikasi ongkir tingkat order: jika orderId sudah ada dengan selisih ongkir identik, skip (hindari double-count)
    // Jika selisih berbeda (ongkir per item), hitung sebagai item terpisah
    if (orderId) {
      const prevDiff = shippingDiffByOrderId.get(orderId)
      if (prevDiff !== undefined && prevDiff === selisihOngkir) {
        // Duplikasi identik â†’ skip
      } else {
        shippingDiffByOrderId.set(orderId, selisihOngkir)
        // Masukkan ke claims hanya jika selisih ongkir beban penjual nyata (> 0)
        if (selisihOngkir > 0) {
          claims.push({
            orderId: orderId || `ORD-${Date.now()}`,
            product: productNameRaw,
            sku: sku || '-',
            resi: resi || '-',
            difference: selisihOngkir,
            shippingDiffSource: 'Selisih Ongkir Bersih'
          })
        }
        // Akumulasi total selisih ongkir beban penjual (hanya nilai > 0)
        if (selisihOngkir > 0) {
          summaryShippingDiffTotal += selisihOngkir
        }
      }
    } else {
      // Tanpa orderId, proses sebagai baris tunggal
      if (selisihOngkir > 0) {
        claims.push({
          orderId: `ORD-${Date.now()}`,
          product: productNameRaw,
          sku: sku || '-',
          resi: resi || '-',
          difference: selisihOngkir,
          shippingDiffSource: 'Selisih Ongkir Bersih'
        })
        summaryShippingDiffTotal += selisihOngkir
      }
    }

    // Akumulasi pecahan potongan per kolom asli untuk Langkah 1
    // Hanya untuk baris produk sukses (bukan baris retur, total, atau non-produk)
    // Gunakan Math.abs agar nilai negatif tetap terakumulasi sebagai potongan positif
    // Hindari double-counting: skip kolom yang sudah diproses oleh deduction key lain
    const usedDeductionCols = new Set()
    deductionColumns.forEach((dc) => {
      const actualCol = findActualDeductionColumn(dc.key, ALIASES[dc.key] || [])
      if (!actualCol || usedDeductionCols.has(actualCol)) return
      usedDeductionCols.add(actualCol)
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

    // Selisih Ongkir: hanya masukkan ke deductionBreakdown jika selisihOngkir > 0 (beban penjual nyata)
    // Jika ongkir pembeli dan ongkir ekspedisi impas (selisihOngkir === 0), jangan masukkan ke Total Potongan Marketplace
    // Hindari double-count multi-item: jika orderId sudah diproses dengan selisih ongkir identik, skip
    if (selisihOngkir > 0) {
      if (orderId) {
        const prevDiff = shippingDiffByOrderId.get(orderId)
        if (prevDiff !== undefined && prevDiff === selisihOngkir) {
          // Sudah diproses di blok di atas â†’ skip
        } else {
          if (!deductionBreakdownMap['shippingDifference']) {
            deductionBreakdownMap['shippingDifference'] = { label: 'Selisih Ongkir', amount: 0 }
          }
          deductionBreakdownMap['shippingDifference'].amount += selisihOngkir
        }
      } else {
        if (!deductionBreakdownMap['shippingDifference']) {
          deductionBreakdownMap['shippingDifference'] = { label: 'Selisih Ongkir', amount: 0 }
        }
        deductionBreakdownMap['shippingDifference'].amount += selisihOngkir
      }
    }

    if (!products[productKey]) {
      products[productKey] = {
        id: productKey, name: productNameRaw, sku, orders: 0, unitsSold: 0,
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
    p.grossRevenue += rowGrossRevenue
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
    // Hanya hitung settlementAmount sekali per Order ID untuk marketplaceFeeRatio (hindari double-count multi-item)
    let totalSettlement = 0
    const seenOrderIdsForFee = new Set()
    for (const p of Object.values(products)) {
      if (p.orderId) {
        if (seenOrderIdsForFee.has(p.orderId)) continue
        seenOrderIdsForFee.add(p.orderId)
      }
      totalSettlement += p.settlementAmount || 0
    }
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
        // Catat entri pertama per Order ID untuk referensi settlement tingkat order
        orderMap.set(oId, { totalGross: 0, count: 0, firstIndex: -1 })
      }
      const entry = orderMap.get(oId)
      entry.totalGross += p.grossRevenue || 0
      entry.count += 1
      if (entry.firstIndex === -1) entry.firstIndex = productList.findIndex(x => x.orderId === oId)
    })
    // Jika tidak ada orderMap, return productList asli
    if (orderMap.size === 0) return productList

    // Tandai entri pertama per orderId untuk digunakan di summary (hindari double-counting settlement)
    orderMap.forEach(entry => {
      if (entry.firstIndex >= 0) productList[entry.firstIndex].__orderFirstEntry = true
    })

    const dedupInfo = productList.map((p, i) => {
      const oId = p.orderId
      const entry = orderMap.get(oId)
      return {
        ...p,
        // Pertahankan nilai asli per item (jangan menol-kan harga atau potongan item kedua/ketiga)
        // Hanya tandai apakah ini adalah item dalam order multi-item
        _isDeduplicated: !!entry && entry.count > 1,
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
  // Hanya hitung settlementAmount sekali per Order ID (dari entri pertama) untuk menghindari double-counting
  const baseSettlementAmount = dedupedProductList.reduce((sum, p) => {
    if (p.orderId && !p.__orderFirstEntry) return sum
    const v = isFinite(p.settlementAmount) ? p.settlementAmount : 0
    return sum + v
  }, 0)
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
    // Langkah 1: Total selisih potongan (Omzet Kotor âˆ’ Dana Bersih Cair)
    totalGrossDeduction: safeReduce(dedupedProductList, 'grossRevenue') - baseSettlementAmount,
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
    shippingDifferenceTotal: summaryShippingDiffTotal,
    globalDeductions: isFinite(globalDeductions) ? globalDeductions : 0,
    returnedOrders: returnedOrders,
    claims: claims,
    hasOrderIdColumn: hasOrderIdColumn,
  }

  // Kumpulkan semua nama kolom asli dari mapping untuk ditampilkan di Langkah 1
  const detectedColumns = Object.entries(mapping)
    .filter(([k]) => !k.startsWith('meta_'))
    .map(([, v]) => v)
    .filter(Boolean)

  // === SAFETY NET: jika total masih 0 padahal ada baris data, scan langsung ===
  // Kolom asli Excel untuk memastikan Gross_Product_Sales dan Net_Settlement_Amount
  // selalu terbaca walaupun semua path pemadat otomatis gagal.
  if (rows.length > 0) {
    const grossCols = ['Gross_Product_Sales', 'Gross Product Sales', 'gross_product_sales', 'gross product sales', 'Total Harga Produk', 'Subtotal Produk', 'Total Penjualan']
    const netCols = ['Net_Settlement_Amount', 'Net Settlement Amount', 'net_settlement_amount', 'net settlement amount', 'Total Penghasilan', 'Total Pendapatan']
    const normGrossCols = grossCols.map(g => normalizeHeader(g))
    const normNetCols = netCols.map(n => normalizeHeader(n))
    let emergencyGross = 0
    let emergencyNet = 0
    for (const row of rows) {
      // Cari kolom gross per baris (normalized match)
      for (const h of Object.keys(row)) {
        const nh = normalizeHeader(h)
        if (normGrossCols.includes(nh) && row[h] !== undefined && row[h] !== '') {
          emergencyGross += toNumber(row[h])
          break
        }
      }
      // Cari kolom net per baris (normalized match)
      for (const h of Object.keys(row)) {
        const nh = normalizeHeader(h)
        if (normNetCols.includes(nh) && row[h] !== undefined && row[h] !== '') {
          emergencyNet += toNumber(row[h])
          break
        }
      }
    }
    // Override summary jika safety net menemukan nilai yang lebih tinggi
    if (emergencyGross > summary.totalGross) {
      summary.totalGross = emergencyGross
      summary.grossRevenue = emergencyGross
    }
    if (emergencyNet > summary.settlementAmount) {
      summary.settlementAmount = emergencyNet
    }
    // Recalculate totalGrossDeduction
    summary.totalGrossDeduction = summary.totalGross - summary.settlementAmount
  }

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
  adCostPeriod = 0,
  fileName = 'Laporan Audit Toko.xlsx',
  marketplace = 'Marketplace'
) {
  const HEADER_FILL = '1E3A8A'
  const HEADER_FONT = { sz: 11, color: { rgb: 'FFFFFF' }, bold: true }
  const HEADER_ALIGNMENT = { horizontal: 'center', vertical: 'center', wrapText: true }
  const HEADER_BORDER = {
    top: { style: 'thin', color: { rgb: '9CA3AF' } },
    bottom: { style: 'thin', color: { rgb: '9CA3AF' } },
    left: { style: 'thin', color: { rgb: '9CA3AF' } },
    right: { style: 'thin', color: { rgb: '9CA3AF' } },
  }
  const DATA_BORDER = {
    top: { style: 'thin', color: { rgb: 'E5E7EB' } },
    bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
    left: { style: 'thin', color: { rgb: 'E5E7EB' } },
    right: { style: 'thin', color: { rgb: 'E5E7EB' } },
  }
  const headerStyle = {
    font: HEADER_FONT,
    fill: { fgColor: { rgb: HEADER_FILL } },
    alignment: HEADER_ALIGNMENT,
    border: HEADER_BORDER,
  }
  const dataStyle = { border: DATA_BORDER }
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
  const ws1Headers = [
    'No', 'Kode SKU', 'Nama Produk', 'Terjual Sukses (Pcs)',
    'Harga Jual Lama (Rp)', 'Potongan Marketplace / Pcs (Rp)',
    'Modal HPP / Pcs (Rp)', 'Biaya Packing / Pcs (Rp)',
    'Laba/Rugi Lama / Pcs (Rp)', 'Margin Lama (%)',
    'Target Profit (%)', 'Harga Jual Baru (Rp)',
    'Selisih Harga (Rp)', 'Estimasi Untung Baru / Pcs (Rp)',
    'Estimasi Margin Baru (%)', 'Status & Rekomendasi',
  ]

  // Header row dengan gaya profesional
  const ws1HeaderCells = ws1Headers.map(h => ({
    t: 's',
    v: h,
    s: headerStyle,
  }))

  const ws1Data = [ws1HeaderCells]

  for (const r of rows) {
    ws1Data.push([
      { t: 'n', v: r.no, s: dataStyle, z: '0' },
      { t: 's', v: r.sku, s: dataStyle },
      { t: 's', v: r.name, s: dataStyle },
      { t: 'n', v: r.unitsSold, s: dataStyle, z: '#,##0' },
      { t: 'n', v: r.oldPrice, s: dataStyle, z: '"Rp"#,##0' },
      { t: 'n', v: r.marketplaceDeduction, s: dataStyle, z: '"Rp"#,##0' },
      { t: 'n', v: r.hpp, s: dataStyle, z: '"Rp"#,##0' },
      { t: 'n', v: r.packingPerUnit, s: dataStyle, z: '"Rp"#,##0' },
      { t: 'n', v: r.oldProfit, s: dataStyle, z: '"Rp"#,##0' },
      { t: 'n', v: r.marginLama / 100, s: dataStyle, z: '0.0%' },
      { t: 'n', v: r.targetProfitPct / 100, s: dataStyle, z: '0%' },
      { t: r.hasHpp ? 'n' : 's', v: r.hasHpp ? r.newPrice : 'Belum Diisi HPP', s: dataStyle, z: '"Rp"#,##0' },
      { t: 'n', v: r.priceDiff, s: dataStyle, z: '"Rp"#,##0' },
      { t: 'n', v: r.estProfit, s: dataStyle, z: '"Rp"#,##0' },
      { t: 'n', v: r.estMargin / 100, s: dataStyle, z: '0.0%' },
      { t: 's', v: r.status, s: dataStyle },
    ])
  }

  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data)

  // Tinggi baris header yang lega
  ws1['!rows'] = [{ hpt: 30 }]

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
  const fileNameLabel = fileName || 'Laporan Audit Toko.xlsx'
  const marketplaceLabel = marketplace || 'Marketplace'

  const totalGross = Number(summary?.totalGross || 0)
  const totalGrossDeduction = Number(summary?.totalGrossDeduction || 0)
  const settlementAmount = Number(summary?.settlementAmount || 0)
  const totalHpp = Number(summary?.totalHpp || 0)
  const totalPackingAll = Number(summary?.totalPacking || 0)
  const totalAdCost = Number(summary?.totalAdCost || adCostPeriod || 0)
  const totalRefundCosts = Number(summary?.totalRefundCosts || summary?.biayaHangusRetur || 0)
  const returnedOrdersCount = Array.isArray(summary?.returnedOrders) ? summary.returnedOrders.length : 0
  const totalUnitsSuccess = Number(summary?.totalUnitsSuccess || 0)
  const totalOrders = Number(summary?.totalOrders || 0)
  const targetProfitPct = Number(targetProfit || 0) * 100

  const totalPengeluaranInternal = totalHpp + totalPackingAll + totalAdCost
  const labaBersih = settlementAmount - totalPengeluaranInternal - totalRefundCosts
  const marginLabaBersih = settlementAmount > 0 ? labaBersih / settlementAmount : 0

  // Total selisih ongkir dari hasil analisis (semua variasi kolom ongkir)
  const totalSelisihOngkir = Number(summary?.shippingDifferenceTotal || summary?.claimAmount || 0)

  // Proyeksi baru berdasarkan rekomendasi harga .900 (Sheet 1)
  // Hitung dari array `rows` (data Sheet 1) karena `newPrice` & `estProfit`
  // hanya tersedia di sana, tidak pada objek `products` asli.
  let estimasiTotalLabaBaru = 0
  for (const r of rows) {
    const units = r.unitsSold || 0
    if (r.hasHpp && r.newPrice && r.newPrice > 0) {
      estimasiTotalLabaBaru += (r.estProfit || 0) * units
    }
  }
  // Kurangi beban retur & selisih ongkir agar laba bersih baru akurat
  estimasiTotalLabaBaru = estimasiTotalLabaBaru - totalRefundCosts - totalSelisihOngkir
  const potensiKenaikanProfit = estimasiTotalLabaBaru - labaBersih

  // Pecahan potongan per kolom asli Excel (dari deductionBreakdown)
  const deductionBreakdown = Array.isArray(summary?.deductionBreakdown) ? summary.deductionBreakdown : []

  // --- Gaya tambahan untuk Sheet 2 ---
  const SECTION_FONT = { sz: 11, color: { rgb: 'FFFFFF' }, bold: true }
  const sectionStyle = {
    font: SECTION_FONT,
    fill: { fgColor: { rgb: HEADER_FILL } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: HEADER_BORDER,
  }
  const LABEL_FONT = { sz: 10, color: { rgb: '374151' } }
  const LABEL_BOLD_FONT = { sz: 10, color: { rgb: '374151' }, bold: true }
  const VALUE_FONT = { sz: 10, color: { rgb: '111827' } }
  const VALUE_BOLD_FONT = { sz: 10, color: { rgb: '111827' }, bold: true }
  const PROFIT_FILL = { fgColor: { rgb: 'D1FAE5' } } // hijau lembut
  const LOSS_FILL = { fgColor: { rgb: 'FEE2E2' } }   // merah lembut

  const addSection = (title) => {
    ws2Data.push([
      { t: 's', v: title, s: sectionStyle },
      { t: 's', v: '', s: sectionStyle },
    ])
  }

  const addRow = (label, value, numFormat, labelStyle = LABEL_FONT, valueStyle = VALUE_FONT, cellFill = null) => {
    ws2Data.push([
      { t: 's', v: label, s: { ...dataStyle, font: labelStyle, fill: cellFill } },
      {
        t: typeof value === 'number' ? 'n' : 's',
        v: value,
        s: { ...dataStyle, font: valueStyle, fill: cellFill, z: numFormat },
      },
    ])
  }

  const ws2Headers = ['Ringkasan Audit Toko', 'Nilai']
  const ws2HeaderCells = ws2Headers.map(h => ({
    t: 's',
    v: h,
    s: headerStyle,
  }))

  const ws2Data = [ws2HeaderCells]

  // --- 1. IDENTITAS & PARAMETER AUDIT ---
  addSection('1. IDENTITAS & PARAMETER AUDIT')
  addRow('Nama File Laporan', fileNameLabel)
  addRow('Platform Marketplace', marketplaceLabel)
  addRow('Total Pesanan Selesai', totalOrders, '0')
  addRow('Total Unit Terjual', totalUnitsSuccess, '#,##0')
  addRow('Target Profit Bersih Dipilih (%)', targetProfitPct / 100, '0%')

  // --- 2. REKAPITULASI DANA MARKETPLACE ---
  addSection('2. REKAPITULASI DANA MARKETPLACE')
  addRow('Total Omzet Kotor', totalGross, '"Rp"#,##0')
  addRow('Total Potongan Marketplace', totalGrossDeduction, '"Rp"#,##0')
  addRow('Total Dana Bersih Cair', settlementAmount, '"Rp"#,##0')

  // --- 3. RINCIAN KOMPONEN POTONGAN & KEBOCORAN DANA ---
  addSection('3. RINCIAN KOMPONEN POTONGAN & KEBOCORAN DANA')
  if (deductionBreakdown.length > 0) {
    for (const item of deductionBreakdown) {
      addRow(String(item.label || 'Potongan Lainnya'), Number(item.amount || 0), '"Rp"#,##0')
    }
  } else {
    addRow('Tidak ada data pecahan potongan yang terbaca dari file', 0, '"Rp"#,##0')
  }
  addRow('Total Selisih Ongkir (Beban Penjual)', totalSelisihOngkir, '"Rp"#,##0', LABEL_BOLD_FONT, VALUE_BOLD_FONT)
  addRow('Total Biaya Hangus Akibat Retur / Batal', totalRefundCosts, '"Rp"#,##0', LABEL_BOLD_FONT, VALUE_BOLD_FONT)
  addRow('Jumlah Pesanan Retur / Batal', returnedOrdersCount, '0')

  // --- 4. PENGELUARAN INTERNAL & LABA BERSIH TOKO ---
  addSection('4. PENGELUARAN INTERNAL & LABA BERSIH TOKO')
  addRow('Total Modal Produk (HPP)', totalHpp, '"Rp"#,##0')
  addRow('Total Biaya Packing', totalPackingAll, '"Rp"#,##0')
  addRow('Total Biaya Iklan / Ads', totalAdCost, '"Rp"#,##0')
  addRow('Total Pengeluaran Internal Toko (HPP + Packing + Iklan)', totalPengeluaranInternal, '"Rp"#,##0', LABEL_BOLD_FONT, VALUE_BOLD_FONT)

  const isProfit = labaBersih >= 0
  const labaFill = isProfit ? PROFIT_FILL : LOSS_FILL
  const labaValueColor = isProfit ? { rgb: '065F46' } : { rgb: '991B1B' }
  addRow(
    'Laba Bersih Toko Sesungguhnya (Rp)',
    labaBersih,
    '"Rp"#,##0',
    LABEL_BOLD_FONT,
    { ...VALUE_BOLD_FONT, color: labaValueColor },
    labaFill
  )
  addRow('Margin Laba Bersih Toko (%)', marginLabaBersih, '0.00%')

  // --- 5. PROYEKSI HASIL SETELAH UPDATE HARGA JUAL BARU (.900) ---
  addSection('5. PROYEKSI HASIL SETELAH UPDATE HARGA JUAL BARU (.900)')
  addRow('Estimasi Total Laba Bersih Baru (Jika Harga Diperbarui)', estimasiTotalLabaBaru, '"Rp"#,##0', LABEL_BOLD_FONT, VALUE_BOLD_FONT)
  addRow('Potensi Kenaikan Profit Tambahan (+Rp)', potensiKenaikanProfit, '"Rp"#,##0', LABEL_BOLD_FONT, VALUE_BOLD_FONT)

  // --- 6. RINCIAN PESANAN SELISIH ONGKIR & BIAYA RETUR ---
  const claimsList = Array.isArray(summary?.claims) ? summary.claims : []
  const returnedList = Array.isArray(summary?.returnedOrders) ? summary.returnedOrders : []
  const hasShippingOrReturnDetail = claimsList.length > 0 || returnedList.length > 0

  if (hasShippingOrReturnDetail) {
    addSection('6. RINCIAN PESANAN SELISIH ONGKIR & BIAYA RETUR')

    // Header tabel detail (5 kolom) dengan gaya header biru tua (#1E3A8A) teks putih tebal
    ws2Data.push([
      { t: 's', v: 'No. Pesanan', s: headerStyle },
      { t: 's', v: 'Nama Produk', s: headerStyle },
      { t: 's', v: 'SKU', s: headerStyle },
      { t: 's', v: 'Keterangan / Status', s: headerStyle },
      { t: 's', v: 'Nominal Beban (Rp)', s: headerStyle },
    ])

    let grandTotalDiff = 0

    // Data dari claims (selisih ongkir)
    for (const c of claimsList) {
      const nominal = Number(c.difference || 0)
      grandTotalDiff += nominal
      ws2Data.push([
        { t: 's', v: String(c.orderId || '-'), s: dataStyle },
        { t: 's', v: String(c.product || '-'), s: dataStyle },
        { t: 's', v: String(c.sku || '-'), s: dataStyle },
        { t: 's', v: String(c.shippingDiffSource || 'Selisih Ongkir'), s: dataStyle },
        { t: 'n', v: nominal, s: { ...dataStyle, z: '"Rp"#,##0' } },
      ])
    }

    // Data dari returnedOrders (biaya retur / pengembalian dana)
    for (const r of returnedList) {
      const nominal = Number(r.lostFeeAmount || r.refundAmount || 0)
      grandTotalDiff += nominal
      ws2Data.push([
        { t: 's', v: String(r.orderId || '-'), s: dataStyle },
        { t: 's', v: String(r.productName || r.product || '-'), s: dataStyle },
        { t: 's', v: String(r.sku || '-'), s: dataStyle },
        { t: 's', v: 'Retur / Pengembalian Dana', s: dataStyle },
        { t: 'n', v: nominal, s: { ...dataStyle, z: '"Rp"#,##0' } },
      ])
    }

    // Baris Total
    ws2Data.push([
      { t: 's', v: '', s: dataStyle },
      { t: 's', v: '', s: dataStyle },
      { t: 's', v: '', s: dataStyle },
      { t: 's', v: 'TOTAL', s: { ...dataStyle, font: { ...LABEL_BOLD_FONT } } },
      { t: 'n', v: grandTotalDiff, s: { ...dataStyle, font: VALUE_BOLD_FONT, z: '"Rp"#,##0' } },
    ])
  }

  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data)

  // Tinggi baris header sheet 2
  ws2['!rows'] = [{ hpt: 30 }]

  const widths2 = [
    { wch: 55 }, // Label / No. Pesanan
    { wch: 35 }, // Nama Produk / Nilai
    { wch: 15 }, // SKU
    { wch: 30 }, // Keterangan / Status
    { wch: 20 }, // Nominal Beban (Rp)
  ]
  ws2['!cols'] = widths2

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws1, 'Rekomendasi_Harga_Baru')
  XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan_Audit_Toko')

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true })
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

