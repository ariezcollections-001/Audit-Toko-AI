'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Download,
  Lock,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { formatRupiah, formatPercent, calculateRecommendedPrice, generateMassUpdateExcel } from '../lib/analysis'
import HppInputTable from './HppInputTable'
import ProfitLeakTable from './ProfitLeakTable'

export default function ResultsSection({
  summary,
  products,
  lossProducts,
  fakeStarProducts,
  claims,
  returnedOrders,
  detectedColumns = [],
  hasOrderIdColumn,
  unlocked,
  setUnlocked,
  setPaid,
  hppInputs,
  setHppInputs,
  onHppChange,
  onHppFileUpload,
  targetProfit,
  setTargetProfit,
  packingCost,
  setPackingCost,
  downloadExcel,
  onBackToHome,
  isAlreadyPaid = false,
  isPaid = false,
  onUpdateHistory,
  historyId,
  adCost = 0,
  onAdCostChange,
}) {
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [showColumnDetails, setShowColumnDetails] = useState(false)
  const [showReturnedOrders, setShowReturnedOrders] = useState(false)
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherMessage, setVoucherMessage] = useState('')
  const [voucherMessageType, setVoucherMessageType] = useState(null)
  const [packingMode, setPackingMode] = useState({})
  const [packingCostPerProduct, setPackingCostPerProduct] = useState({})
  const [adCostPeriod, setAdCostPeriod] = useState(adCost)

  // Sinkronkan adCostPeriod dengan prop adCost dari page.js agar
  // perubahan biaya iklan langsung tercermin di perhitungan Langkah 3
  useEffect(() => {
    setAdCostPeriod(adCost)
  }, [adCost])

  // Gulir otomatis ke "Ringkasan Laba Bersih Toko" setelah pembayaran QRIS berhasil
  useEffect(() => {
    if (paymentSuccess) {
      const el = document.getElementById('ringkasan-laba-bersih')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [paymentSuccess])

  const handlePayment = () => {
    setPaymentLoading(true)
    setTimeout(() => {
      setPaymentLoading(false)
      setPaid(true)
      setUnlocked(true)
      setPaymentSuccess(true)
      if (onUpdateHistory && historyId) {
        onUpdateHistory(historyId, { isPaid: true, paid: true })
      }
    }, 1500)
  }

  const handlePackingModeChange = (productId, mode) => {
    setPackingMode((prev) => ({ ...prev, [productId]: mode }))
  }

  const handlePackingCostChange = (productId, value) => {
    setPackingCostPerProduct((prev) => ({ ...prev, [productId]: value }))
  }

  const handleDownloadExcel = () => {
    if (products.length === 0) {
      alert('Tidak ada produk untuk diekspor.')
      return
    }
    const buf = generateMassUpdateExcel(
      products,
      targetProfit,
      packingCost,
      packingCostPerProduct,
      packingMode,
      computed?.feeRatio ?? 0.1,
      summary,
      adCostPeriod
    )
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mass-update-harga-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- Voucher / Promo Code (1x pakai, case-sensitive, dari .env.local) ---
  const VOUCHER_CODES_DEFAULT = 'AuditVIP01,AuditVIP02,AuditVIP03,PromoToko99'
  const voucherCodesRaw =
    typeof process.env.NEXT_PUBLIC_VOUCHER_CODES === 'string'
      ? process.env.NEXT_PUBLIC_VOUCHER_CODES
      : VOUCHER_CODES_DEFAULT
  const voucherCodes = voucherCodesRaw.split(',').map((c) => c.trim()).filter(Boolean)

  const getUsedVouchers = () => {
    try {
      const raw = localStorage.getItem('audit_used_vouchers')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  const saveUsedVoucher = (code) => {
    const used = getUsedVouchers()
    if (!used.includes(code)) {
      used.push(code)
      localStorage.setItem('audit_used_vouchers', JSON.stringify(used))
    }
  }

  const handleApplyVoucher = () => {
    const code = voucherCode.trim()
    if (!code) return

    const used = getUsedVouchers()

    if (used.includes(code)) {
      setVoucherMessage('Maaf, kode voucher ini sudah pernah digunakan di perangkat ini.')
      setVoucherMessageType('error')
      return
    }

    if (voucherCodes.includes(code)) {
      saveUsedVoucher(code)
      setUnlocked(true)
      setVoucherMessage('Kode Voucher Berhasil Diterapkan — Akses Penuh Terbuka!')
      setVoucherMessageType('success')
      if (onUpdateHistory && historyId) {
        onUpdateHistory(historyId, { isPaid: true, paid: true })
      }
      // Gulir ke Ringkasan Laba Bersih Toko setelah voucher berhasil
      const el = document.getElementById('ringkasan-laba-bersih')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      setVoucherMessage('Kode voucher tidak valid (pastikan huruf besar, huruf kecil, dan angka sesuai).')
      setVoucherMessageType('error')
    }
  }

const safePackingCost = isFinite(packingCost) ? packingCost : 0
const totalOrders = summary?.totalOrders || 0
const totalSettlement = summary?.settlementAmount || 0
const totalHpp = summary?.totalHpp || 0

// --- Hitung ulang semua nilai derivatif ketika packingCost atau summary berubah ---
  const computed = useMemo(() => {
    if (!summary) return null

    // Total biaya packing dari penjumlahan per produk di tabel HPP
    const totalPackingFromTable = products.reduce((acc, p) => {
      const mode = packingMode[p.id] || 'perOrder'
      const packingCostVal = packingCostPerProduct[p.id] || 0
      const units = Math.max(p.unitsSold || 0, 1)
      const uniqueOrderCount = p.uniqueOrderCount || p.orders || 0
      const totalPackingProduk = mode === 'perUnit'
        ? packingCostVal * units
        : packingCostVal * uniqueOrderCount
      return acc + totalPackingProduk
    }, 0)

    const labaBersih = isFinite(totalSettlement) && isFinite(totalHpp)
      ? totalSettlement - totalHpp - totalPackingFromTable - adCostPeriod - (summary?.totalRefundCosts ?? 0)
      : 0
    const marginBersih =
      totalSettlement > 0 ? (labaBersih / totalSettlement) * 100 : 0

    // Rasio potongan marketplace (global, konsisten dengan analysis.js)
    const totalMarketplaceFees = products.reduce(
      (acc, p) => acc + (isFinite(p.marketplaceFees) ? p.marketplaceFees : 0),
      0
    )
    const feeRatio =
      totalSettlement > 0 ? totalMarketplaceFees / totalSettlement : 0.1

    return {
      labaBersih,
      marginBersih,
      feeRatio,
      totalBiayaPacking: totalPackingFromTable,
    }
  }, [summary, packingCostPerProduct, packingMode, products, adCostPeriod])

    

    // 3. Per-baris produk: laba/rugi + harga jual minimal baru yang termasuk biaya packing
    const productRows = products.map((p) => {
      const units = Math.max(p.unitsSold || 0, 1)
      const orders = p.orders || 0
      const hppTotal = p.hppTotal || 0
      const hppValue = Number(p.hpp) || 0

      // Biaya packing per produk berdasarkan mode (sama dengan ProfitLeakTable)
      const mode = packingMode[p.id] || 'perOrder'
      const packingCostVal = Number(packingCostPerProduct[p.id]) || 0
      const uniqueOrderCount = Number(p.uniqueOrderCount) || orders || 0
      const totalPackingProduk = mode === 'perUnit'
        ? packingCostVal * units
        : packingCostVal * uniqueOrderCount

      // netProfitProduk = settlement - (hpp * units + totalPackingProduk)
      const safeSettlement = isFinite(p.settlementAmount) ? p.settlementAmount : 0
      const safeHppTotal = isFinite(hppTotal) ? hppTotal : 0
      const netProfitProduk = safeSettlement - (safeHppTotal * units + totalPackingProduk)

      // Harga Jual Minimal Baru = (HPP per unit + biaya packing per unit) /
      //                           (1 - feeRatio - targetProfitRatio), dibulatkan ke atas ke .900
      const packingPerUnit = units > 0 ? totalPackingProduk / units : 0
      const effectiveHpp = hppValue
      const recommendedPrice = calculateRecommendedPrice(
        effectiveHpp + packingPerUnit,
        computed?.feeRatio ?? 0,
        targetProfit
      )

      // Harga jual lama (saat ini) sebagai pembanding
      const currentPrice =
        p.productPrice > 0
          ? p.productPrice
          : p.unitsSold > 0
          ? p.grossRevenue / p.unitsSold
          : 0
      const priceDiff = recommendedPrice - currentPrice

      return {
        ...p,
        netProfitProduk,
        recommendedPrice: recommendedPrice !== null ? recommendedPrice : 0,
        currentPrice: isFinite(currentPrice) ? currentPrice : 0,
        priceDiff: isFinite(priceDiff) ? priceDiff : 0,
      }
    })



  return (
    <section className="py-16 md:py-24 bg-gray-50">
      {onBackToHome && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-slate-600 font-medium hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowRight className="w-4 h-4" rotate="-90" />
            Kembali ke Beranda / Upload File Lain
          </button>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ============================================================
           LANGKAH 1 — RINCIAN DANA & PECAHAN POTONGAN MARKETPLACE
           ============================================================ */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Audit Dana Marketplace
          </h2>
          <p className="text-lg text-gray-600">
            Rincian dana & potongan marketplace — data asli diambil dari file Excel Anda.
          </p>
        </div>

        {/* Langkah 1 — Kartu Ringkasan Dana */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Total Omzet Kotor</h3>
            </div>
            <p className="text-3xl font-bold text-blue-900">
              {formatRupiah(summary?.totalGross || 0)}
            </p>
            <p className="text-sm text-gray-500">Harga jual dari file Excel (Sebelum potongan)</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-red-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-gray-900">− Total Potongan Marketplace</h3>
            </div>
            <p className="text-3xl font-bold text-red-700">
              {formatRupiah(summary?.totalGrossDeduction || 0)}
            </p>
            <p className="text-sm text-gray-500">Total selisih Omzet Kotor − Dana Bersih Cair</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-emerald-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">= Total Dana Bersih Cair</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-700">
              {formatRupiah(summary?.settlementAmount || 0)}
            </p>
            <p className="text-sm text-gray-500">Uang bersih yang masuk ke saldo penjual</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 text-green-600">✓</span>
              <h3 className="font-semibold text-gray-900">Saldo Terverifikasi</h3>
            </div>
            <p className="text-sm font-medium text-green-800">
              100% Cocok dengan File Laporan
            </p>
            <p className="text-xs text-green-600 mt-1">
              Setiap angka adalah penjumlahan eksak dari baris-baris valid — tidak ada estimasi.
            </p>
          </div>
        </div>

        {/* Langkah 1 — Tabel Pecahan Potongan per Kolom Asli */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              Pecahan Potongan per Kolom Asli Excel
            </h3>
            <span className="text-xs text-gray-500">
              Setiap baris = satu kolom biaya yang terdeteksi dalam file Anda
            </span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kolom Biaya (Asli dari Excel)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Rupiah</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">% dari Omzet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary?.deductionBreakdown?.length > 0 ? (
                  summary.deductionBreakdown
                    .filter((item) => item.amount > 0)
                    .map((item) => {
                      const pct = summary?.totalGross ? ((item.amount / summary.totalGross) * 100) : 0
                      return (
                        <tr key={item.label}>
                          <td className="px-4 py-3 text-left text-gray-800 font-medium">
                            {item.label}
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 font-semibold">
                            -{formatRupiah(item.amount)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500 text-xs">
                            {pct.toFixed(1)}%
                          </td>
                        </tr>
                      )
                    })
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-400 text-sm">
                      Tidak ditemukan komponen potongan marketplace pada format laporan ini.
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-50 font-bold border-t border-gray-200">
                  <td className="px-4 py-3 text-left text-gray-800">Total Potongan Marketplace</td>
                  <td className="px-4 py-3 text-right text-red-700 font-semibold">
                    -{formatRupiah(summary?.totalGrossDeduction || 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {summary?.totalGross ? (((summary?.totalGrossDeduction || 0) / summary.totalGross) * 100).toFixed(1) : '0'}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Jika suatu komponen (seperti Selisih Ongkir atau Retur) tidak muncul di atas, berarti
            kolom tersebut tidak ada pada format file Excel Anda (nilai Rp 0).
          </p>
        </div>


        {/* ============================================================
           LANGKAH 2 — INPUT MODAL (HPP) & BIAYA PACKING PER PRODUK
           ============================================================ */}
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Input Modal & Packing
          </h2>
          <p className="text-lg text-gray-600">
            Silahkan Isi Harga Modal (HPP) & Biaya Packing per produk Untuk Mengetahui Status,Laba Bersih,Ataupun Rugi.
          </p>
        </div>

        {/* Kotak input biaya iklan permanen di atas area scroll Langkah 2 */}
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-xl shadow-sm">
          <div className="flex items-center gap-4 justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Biaya Iklan / Ads Periode Ini (Opsional - Rp)</p>
              <p className="text-[10px] text-blue-500">
                Masukkan total pengeluaran iklan (Shopee Ads / TikTok Ads / TopAds) selama periode laporan ini jika
                Anda beriklan. Jika tidak ada potongan/pengeluaran iklan, tidak perlu diisi (biarkan Rp 0).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-700 text-sm">Rp</span>
              <input
                defaultValue={String(adCostPeriod)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '')
                  const val = raw ? parseInt(raw) : 0
                  if (onAdCostChange) onAdCostChange(val)
                }}
                className="w-32 px-3 py-2 bg-white border border-blue-400 rounded-lg text-right text-sm font-medium text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="max-h-[450px] overflow-y-auto border border-gray-200 rounded-lg mb-8">
          <HppInputTable
          products={products}
          onHppChange={onHppChange}
          packingCost={packingCost}
          packingCostPerProduct={packingCostPerProduct}
          onPackingCostChange={handlePackingCostChange}
          adCostPeriod={adCostPeriod}
          onAdCostChange={onAdCostChange}
          totalAllUnits={summary?.totalAllUnits || 0}
          totalUnitsSuccess={summary?.totalUnitsSuccess || 0}
          totalUnitsReturned={summary?.totalUnitsReturned || 0}
          returnedOrders={returnedOrders}
          isPaid={isPaid || isAlreadyPaid}
        />
        </div>

        {/* Gerbang Pembayaran QRIS — ditampilkan sebelum pembayaran selesai */}
        {!isPaid && !isAlreadyPaid && (
          <div className="mt-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-10 text-white shadow-2xl border border-slate-700/50">
            <div className="text-center">
              <h3 className="text-2xl font-bold tracking-tight mb-2">Buka Laporan Lengkap</h3>
              <p className="text-slate-300 mb-8">
                Input Modal & Packing sudah tersedia. Untuk melihat Ringkasan Laba Bersih Toko
                dan semua fitur analisis lanjutan, silakan selesaikan pembayaran QRIS sebesar Rp 15.000.
              </p>

              <div className="mt-6 mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  AKSES FITUR YANG AKAN DIBUKA
                </p>
                <ul className="text-sm text-slate-300 space-y-1.5 list-disc list-inside text-left max-w-xs mx-auto">
                  <li>
                    Ringkasan Laba Bersih Toko Sesungguhnya (Setelah dikurangi HPP, Packing, Iklan &amp; Retur)
                  </li>
                  <li>
                    Bedah Profit &amp; Margin per Produk (Identifikasi produk Rugi, Margin Tipis, &amp; Sehat)
                  </li>
                  <li>
                    Simulasi Target Profit Bersih (10%–30% &amp; angka bebas sesuai target Anda)
                  </li>
                  <li>
                    Rekomendasi Harga Jual Baru yang Optimal (Pembulatan psikologis berendingan '.900')
                  </li>
                  <li>
                    Unduh File Excel Siap Pakai Hasil Audit (2 Sheet lengkap siap upload)
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setShowPaymentConfirm(true)}
                className="w-full md:w-auto inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold shadow-lg shadow-blue-600/30 transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Buka Laporan Lengkap via QRIS — Rp 15.000
              </button>
              <p className="text-xs text-slate-400 mt-4 text-center max-w-xs mx-auto">
                Tarif sekali bayar per 1 laporan audit — tanpa biaya langganan bulanan.
              </p>

              <div className="mt-6 pt-6 border-t border-slate-600/30">
                <p className="text-sm text-slate-300 text-center mb-3 font-medium">
                  Punya Kode Voucher / Promo?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
                  <input
                    type="text"
                    placeholder="Masukkan kode voucher"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-slate-600 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64 text-sm"
                  />
                  <button
                    onClick={handleApplyVoucher}
                    className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    Gunakan Kode
                  </button>
                </div>
                {voucherMessage && voucherMessageType === 'error' && (
                  <p className="mt-3 text-sm text-center font-medium text-red-400">
                    {voucherMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {isPaid || isAlreadyPaid ? (
          <>
            {/* ============================================================
               LANGKAH 3 — RINGKASAN LABA BERSIH TOKO (Hanya setelah bayar)
               ============================================================ */}
            <div className="text-center mb-6">
              <h2 id="ringkasan-laba-bersih" className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Ringkasan Laba Bersih Toko
              </h2>
              <p className="text-lg text-gray-600">
                Hasil akhir perhitungan : Dana Bersih Cair − HPP − Packing - ADS - dan lainnya.
              </p>
            </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3">
            <div>
              <p className="text-emerald-200 text-xs">Total Dana Bersih Cair</p>
              <p className="text-sm font-bold">{formatRupiah(summary?.settlementAmount || 0)}</p>
              <p className="text-[10px] text-emerald-100">Dana Cair dari Marketplace</p>
            </div>
            <div>
              <p className="text-emerald-200 text-xs">− Total Modal HPP</p>
              <p className="text-sm font-bold text-red-200">{formatRupiah(summary?.totalHpp || 0)}</p>
              <p className="text-[10px] text-emerald-100">HPP × Unit Terjual</p>
            </div>
            <div>
              <p className="text-emerald-200 text-xs">− Total Biaya Packing</p>
              <p className="text-sm font-bold text-red-200">{formatRupiah(computed?.totalBiayaPacking ?? 0)}</p>
              <p className="text-[10px] text-emerald-100">Σ Packing per Produk</p>
            </div>
            <div>
              <p className="text-emerald-200 text-xs">− Total Biaya Iklan / Ads</p>
              <p className="text-sm font-bold text-red-200">{formatRupiah(adCostPeriod)}</p>
              <p className="text-[10px] text-emerald-100">Biaya Iklan Periode Ini</p>
            </div>
            <div>
              <p className="text-emerald-200 text-xs">− Biaya Hangus Akibat Retur</p>
              <p className="text-sm font-bold text-red-200">{formatRupiah(summary?.totalRefundCosts ?? 0)}</p>
              <p className="text-[10px] text-emerald-100">Admin + Ongkir pesanan retur</p>
            </div>
            <div>
              <p className="text-emerald-200 text-xs">= Laba Bersih Sesungguhnya</p>
              <p className="text-sm font-bold">{formatRupiah(computed?.labaBersih ?? 0)}</p>
              <p className="text-[10px] text-emerald-100">Dana Cair − HPP − Packing − Iklan − Retur</p>
            </div>
          </div>
          {(summary?.globalDeductions ?? 0) !== 0 && (

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">

              <p className="text-amber-700 text-sm font-medium">Potongan Lain-lain / Iklan</p>

              <p className="text-amber-600 text-sm">{formatRupiah(Math.abs(summary?.globalDeductions ?? 0))}</p>

              <p className="text-amber-500 text-xs mt-1">

                Potongan global non-produk (iklan, penalti, penyesuaian)

              </p>

            </div>

          )}

            </div>
          </>
        ) : null}

        {isPaid || isAlreadyPaid ? (
          <>
            {/* ============================================================
               LANGKAH 4 — REKOMENDASI HARGA JUAL BARU 7 KOLOM (Hanya setelah bayar)
               ============================================================ */}
            <div className="text-center mb-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Rekomendasi Harga Jual Baru
              </h2>
              <p className="text-lg text-gray-600">
                Pilih Profit Yang Anda Inginkan, dan sistem akan menghitung harga jual baru yang optimal untuk setiap produk.
              </p>
            </div>

            {/* Target Profit Bar — dipindahkan tepat di atas tabel Langkah 4 */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">Target Profit Bersih:</span>
                    <div className="flex gap-2">
                      {[10, 15, 20, 25, 30].map((val) => (
                        <button
                          key={val}
                          onClick={() => setTargetProfit(val / 100)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                            targetProfit === val / 100
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {val}%
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          const val = parseFloat(prompt('Masukkan target profit persen (contoh: 18):', (targetProfit * 100).toString()))
                          if (!isNaN(val) && val > 0 && val < 100) setTargetProfit(val / 100)
                        }}
                        className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                      >
                        Lainnya
                      </button>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    (target profit = {(targetProfit * 100).toFixed(0)}%)
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Semua rekomendasi harga jual akan dihitung ulang sesuai target profit ini.
                </p>
              </div>
            </div>

            <div className="max-h-[450px] overflow-y-auto border border-gray-200 rounded-lg mb-8">
            <ProfitLeakTable
              products={products}
              claims={claims}
              unlocked={unlocked}
              packingCost={packingCost}
              targetProfit={targetProfit}
              feeRatio={computed?.feeRatio ?? 0}
              packingCostPerProduct={packingCostPerProduct}
              packingMode={packingMode}
            />
            </div>
          </>
        ) : null}

        {isAlreadyPaid ? (
          <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">Laporan Sudah Terbuka</h3>
                <p className="text-sm text-emerald-600">
                  Status: <span className="font-semibold">Lunas / Sudah Terbuka</span> —
                  seluruh fitur analisis tersedia tanpa pembayaran ulang.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                ✓ Terbuka
              </span>
            </div>
          </div>
        ) : null}

        {voucherMessageType === 'success' && (
          <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-center font-medium shadow-sm">
            Kode Voucher Berhasil Diterapkan — Akses Penuh Terbuka!
          </div>
        )}

        {/* Modal Loading Mengambang saat verifikasi pembayaran QRIS */}
        {paymentLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl border border-blue-100 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-slate-900">
                    Memverifikasi status pembayaran QRIS…
                  </p>
                  <p className="text-sm text-slate-500">
                    Mohon tunggu sebentar, kami sedang memproses konfirmasi pembayaran Anda.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Popup Berhasil Pembayaran QRIS */}
        {paymentSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl border border-emerald-100 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-slate-900">Pembayaran Berhasil!</p>
                  <p className="text-sm text-slate-500">
                    Laporan Lengkap Telah Terbuka — Semua fitur analisis kini tersedia.
                  </p>
                </div>
                <button
                  onClick={() => setPaymentSuccess(false)}
                  className="inline-flex items-center gap-2 px-6 py-3 btn-gradient text-white rounded-xl font-semibold shadow-premium hover:shadow-xl transition-colors"
                >
                   Lanjutkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gerbang 2 — Modal Konfirmasi Sebelum Pembayaran QRIS */}
        {showPaymentConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowPaymentConfirm(false)} />
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl border border-blue-200 w-full max-w-md mx-4 transform transition-all duration-200 scale-100">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl">
                  ℹ️
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Konfirmasi Kecocokan Data Sebelum Pembayaran</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Sebelum membeli kunci akses, pastikan angka berikut sesuai dengan data di Seller Center Anda:
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm text-gray-600">Total Omzet Kotor</span>
                  <span className="text-sm font-semibold text-gray-900">{formatRupiah(summary?.totalGross || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm text-gray-600">− Total Potongan Marketplace</span>
                  <span className="text-sm font-semibold text-red-600">-{formatRupiah(summary?.totalGrossDeduction || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-sm text-gray-600">= Total Dana Bersih Cair</span>
                  <span className="text-sm font-semibold text-emerald-700">{formatRupiah(summary?.settlementAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-sm text-gray-600">− Total Biaya Iklan / Ads</span>
                  <span className={`text-sm font-semibold ${adCostPeriod > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    -{formatRupiah(adCostPeriod)}
                  </span>
                </div>
                </div>

              <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                <span className="font-semibold text-gray-900">Apakah rincian Dana Bersih Cair di atas sudah sesuai dengan saldo penghasilan di Seller Center Anda?</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowPaymentConfirm(false)
                    handlePayment()
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Ya, Data Sudah Cocok — Lanjut Bayar QRIS Rp 15.000
                </button>
                <button
                  onClick={() => setShowPaymentConfirm(false)}
                  className="w-full sm:w-auto px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Batal / Periksa Ulang Data
                </button>
              </div>
            </div>
          </div>
        )}

        {(unlocked || isAlreadyPaid) && (
          <div className="mt-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unduh File Perbaikan</h3>
              <p className="text-sm text-gray-600">
                File Excel berisi daftar produk yang perlu update harga jual berdasarkan HPP dan target profit {(targetProfit * 100).toFixed(0)}%.
              </p>
            </div>
            <button
              onClick={handleDownloadExcel}
              disabled={products.length === 0}
              className={`w-full btn-gradient text-white rounded-2xl font-semibold shadow-premium hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-premium transition-all inline-flex items-center justify-center gap-2 px-6 py-4`}
            >
              <Download className="w-5 h-5" />
              Unduh File Mass Update Harga
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

