'use client'

import { useState } from 'react'
import { FileSpreadsheet, AlertCircle, RefreshCw } from 'lucide-react'
import {
  parseExcelFile,
  smartMapHeaders,
  normalizeHeader,
  calculateAnalysis,
  parseHppFile,
  validateExcelFile,
  NON_EXCEL_WARNING_MESSAGE,
} from '../lib/analysis'

export default function UploadSection({
  marketplace,
  onFileProcessed,
  onHppFileUpload,
  detectedFormat,
}) {
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState(null)
  const [error, setError] = useState(null)
  const [mappingInfo, setMappingInfo] = useState(null)
  // Fallback Manual Mapping state
  const [showManualMapping, setShowManualMapping] = useState(false)
  const [unmappedHeaders, setUnmappedHeaders] = useState([])
  const [manualMapping, setManualMapping] = useState({})
  const [pendingRecords, setPendingRecords] = useState(null)
  const [pendingHeaders, setPendingHeaders] = useState(null)

  const handleRetryUpload = () => {
    setError(null)
    setFileName(null)
    setMappingInfo(null)
    setShowManualMapping(false)
    setUnmappedHeaders([])
    setManualMapping({})
    setPendingRecords(null)
    setPendingHeaders(null)
    document.getElementById('uploadFileInput')?.click()
  }

  const handleManualMappingChange = (header, fieldKey) => {
    setManualMapping((prev) => ({ ...prev, [header]: fieldKey }))
  }

  const handleConfirmManualMapping = async () => {
    if (!pendingRecords || !pendingHeaders) return
    // Gabungkan mapping otomatis dengan mapping manual
    const { mapping: autoMapping } = smartMapHeaders(pendingHeaders, marketplace)
    const mergedMapping = { ...autoMapping }

    // Masukkan mapping manual ke dalam mergedMapping
    // manualMapping berisi { header: fieldKey }
    Object.entries(manualMapping).forEach(([header, fieldKey]) => {
      if (fieldKey && fieldKey.trim() !== '') {
        mergedMapping[fieldKey.trim()] = header
      }
    })

    setMappingInfo({
      headers: pendingHeaders,
      mapping: mergedMapping,
      mappedCount: Object.keys(mergedMapping).length,
    })
    setShowManualMapping(false)
    setUnmappedHeaders([])
    setManualMapping({})
    setPendingRecords(null)
    setPendingHeaders(null)
    await onFileProcessed(pendingRecords, mergedMapping, pendingHeaders, fileName || 'file')
  }

  const handleSkipManualMapping = async () => {
    if (!pendingRecords || !pendingHeaders) return
    const { mapping: autoMapping } = smartMapHeaders(pendingHeaders, marketplace)
    setMappingInfo({
      headers: pendingHeaders,
      mapping: autoMapping,
      mappedCount: Object.keys(autoMapping).length,
    })
    setShowManualMapping(false)
    setUnmappedHeaders([])
    setManualMapping({})
    setPendingRecords(null)
    setPendingHeaders(null)
    await onFileProcessed(pendingRecords, autoMapping, pendingHeaders, fileName || 'file')
  }

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (file) await processFile(file)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) await processFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const processFile = async (file) => {
    const validation = validateExcelFile(file)
    if (!validation.valid) {
      setError(validation.errorMessage)
      return
    }
    setError(null)
    setFileName(file.name)
    setMappingInfo(null)

    // Hoist ke luar try agar catch block dapat mengaksesnya saat zero-safety
    // dari page.js memicu manual mapping.
    let headers, records

    try {
      const parsed = await parseExcelFile(file)
      headers = parsed.headers
      records = parsed.records
      const { mapping, requiredColumnConfidence } = smartMapHeaders(headers, marketplace)

      // === Strict Confidence Check: kolom wajib (productPrice & settlementAmount) ===
      // Jika skor keyakinan untuk Omzet Kotor atau Dana Bersih Cair di bawah 80,
      // artinya nama kolom asing dari marketplace yang tidak dikenali. Jangan tebak
      // kolom acak—picu Fallback Manual Mapping agar pengguna memilih kolom yang benar.
      const requiredConfidenceBelowThreshold =
        (requiredColumnConfidence.productPrice !== undefined && requiredColumnConfidence.productPrice < 80) ||
        (requiredColumnConfidence.settlementAmount !== undefined && requiredColumnConfidence.settlementAmount < 80)

      // === Zero-Safety Trigger: jangan biarkan halaman hasil Rp 0 tercapai ===
      let totalGross = 0
      let settlementAmount = 0
      if (records.length > 0) {
        const { summary } = calculateAnalysis(records, mapping, {}, marketplace)
        totalGross = summary.totalGross || 0
        settlementAmount = summary.settlementAmount || 0
      }
      if (records.length > 0 && (requiredConfidenceBelowThreshold || totalGross <= 0 || settlementAmount <= 0)) {
        setPendingRecords(records)
        setPendingHeaders(headers)
        // Semua header tersedia agar pengguna dapat memilih ulang semua kolom
        setUnmappedHeaders(headers)
        setManualMapping({})
        setShowManualMapping(true)
        setError(null)
        return
      }

      // Deteksi kolom yang belum ter-alias (tidak muncul di nilai mapping).
      // Bandingkan dengan header yang telah dinormalisasi agar pemisah simbol
      // (_ - . / spasi ganda) tidak menyebabkan kolom yang sebenarnya cocok
      // dianggap "belum dikenal".
      const mappedColumnNames = new Set(
        Object.values(mapping).map((h) => normalizeHeader(h))
      )
      const unmappedHeaders = headers.filter(
        (h) => !mappedColumnNames.has(normalizeHeader(h))
      )

      if (unmappedHeaders.length > 0) {
        // Tampilkan UI manual mapping untuk kolom yang belum dikenali
        setPendingRecords(records)
        setPendingHeaders(headers)
        setUnmappedHeaders(unmappedHeaders)
        setManualMapping({})
        setShowManualMapping(true)
        setError(null)
        return
      }

      setMappingInfo({ headers, mapping, mappedCount: Object.keys(mapping).length })
      await onFileProcessed(records, mapping, headers, file.name)
    } catch (err) {
      // Jika page.js melempar sinyal zero-safety (total omzet/dana cair nol),
      // tampilkan kotak kuning Fallback Manual Mapping alih-alih dialog error.
      if (err.message === 'ZERO_SAFETY_TRIGGERED' && records && records.length > 0) {
        setPendingRecords(records)
        setPendingHeaders(headers)
        // Semua header tersedia agar pengguna dapat memilih ulang semua kolom
        setUnmappedHeaders(headers)
        setManualMapping({})
        setShowManualMapping(true)
        setError(null)
        return
      }
      setError(err.message || NON_EXCEL_WARNING_MESSAGE)
    }
  }

  return (
    <section id="mulai-analisis" className="py-4 md:py-6 bg-white">
      {/* Modal Peringatan Gagal Upload */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl border border-amber-100 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">Gagal Membaca File</p>
                <p className="text-sm text-slate-500 text-center leading-relaxed">
                  {error}
                </p>
              </div>
              <button
                onClick={handleRetryUpload}
                className="inline-flex items-center gap-2 px-6 py-3 btn-gradient text-white rounded-xl font-semibold shadow-premium hover:shadow-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Upload Ulang File
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-2">
            Mulai Analisis Sekarang
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Unggah laporan penjualan marketplace dan dapatkan analisis profit
            yang akurat dalam hitungan detik. Tidak perlu daftar akun.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-sm flex items-center gap-4 shadow-sm">
            <span className="w-6 h-6 text-amber-600">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Single centered upload card */}
        <div className="max-w-2xl mx-auto">
          <div
            className={`border-2 border-dashed rounded-3xl py-6 px-6 text-center transition-all duration-300 shadow-sm bg-slate-50 ${dragActive ? 'border-emerald-500 shadow-md' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50'}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileSpreadsheet className="w-7 h-7 text-slate-400" />
              <span className="text-base font-medium text-slate-600">
                Seret &amp; lepas file di sini
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
              Format yang didukung: .xlsx dan .csv dari Seller Center
              Shopee, TikTok Shop, Tokopedia, Lazada, atau Bukalapak.
            </p>

            <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
              <label
                className="group inline-flex items-center gap-3 px-7 py-4 btn-gradient text-white rounded-2xl font-semibold shadow-premium hover:shadow-xl cursor-pointer min-w-[240px] justify-center"
                onClick={() => document.getElementById('uploadFileInput')?.click()}
              >
                <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Pilih File Excel/CSV
                <input
                  id="uploadFileInput"
                  type="file"
                  accept=".xlsx,.csv"
                  className="file-input-hidden"
                  onChange={handleFile}
                />
              </label>
            </div>

            {fileName && (
              <div className="mt-8 flex items-center gap-2 justify-center text-sm text-emerald-700 font-medium bg-emerald-50/50 px-4 py-3 rounded-xl inline-block border border-emerald-100">
                <span className="w-5 h-5 text-emerald-600">✓</span>
                {fileName} siap dianalisis
              </div>
            )}

            {detectedFormat && (
              <div className="mt-6 flex justify-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-semibold shadow-sm">
                  ✓ Format Laporan Terdeteksi Otomatis: {detectedFormat}
                </span>
              </div>
            )}

            {mappingInfo && (
              <div className="mt-6 p-4 bg-slate-50 rounded-2xl text-left text-xs text-slate-600 border border-slate-100 shadow-sm">
                <p className="font-semibold mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Kolom yang dikenali otomatis
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {mappingInfo.mappedCount} dari {mappingInfo.headers.length} kolom
                </p>
              </div>
            )}

            {/* Fallback Manual Mapping — tampilkan saat ada kolom yang belum terdeteksi */}
            {showManualMapping && (
              <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-5 h-5 text-amber-600 flex-shrink-0">⚙️</span>
                  <div>
                    <p className="font-bold text-amber-900 text-sm">Tentukan Kolom yang Belum Dikenali</p>
                    <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                      Beberapa kolom dalam file Anda belum dikenali otomatis. Silakan pilih fungsi setiap kolom
                      di bawah ini agar analisis profit akurat. Kolom yang tidak dipilih akan diabaikan.
                    </p>
                  </div>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {unmappedHeaders.map((header) => (
                    <div key={header} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-sm text-slate-700 truncate max-w-[200px]">{header}</span>
                      <select
                        value={manualMapping[header] || ''}
                        onChange={(e) => handleManualMappingChange(header, e.target.value)}
                        className="text-xs bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-amber-500 outline-none"
                      >
                        <option value="">— Pilih fungsi —</option>
                        <option value="orderId">No. Pesanan / Order ID</option>
                        <option value="productName">Nama Produk</option>
                        <option value="sku">SKU / Kode Produk</option>
                        <option value="settlementAmount">Total Penghasilan / Dana Cair</option>
                        <option value="productPrice">Harga Jual Produk</option>
                        <option value="quantity">Jumlah Terjual / Qty</option>
                        <option value="shippingFee">Ongkir / Biaya Kirim</option>
                        <option value="platformCommission">Biaya Administrasi / Komisi Platform</option>
                        <option value="refund">Pengembalian Dana / Refund</option>
                        <option value="voucher">Potongan Voucher</option>
                        <option value="discount">Diskon</option>
                        <option value="adsFee">Biaya Iklan / Ads</option>
                        <option value="shippingDifference">Selisih Ongkir</option>
                        <option value="tax">Pajak (PPN/PPh)</option>
                        <option value="otherFee">Biaya Lainnya</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    onClick={handleSkipManualMapping}
                    className="flex-1 px-4 py-2 bg-white text-slate-600 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Lewati (gunakan otomatis saja)
                  </button>
                  <button
                    onClick={handleConfirmManualMapping}
                    disabled={!pendingRecords}
                    className="flex-1 px-4 py-2 btn-gradient text-white rounded-lg font-semibold shadow-premium hover:shadow-xl transition-colors disabled:opacity-50"
                  >
                    Simpan & Lanjut Analisis
                  </button>
                </div>
              </div>
            )}

            {/* Gerbang 1 — Jaminan Transparansi 100% Gratis Cek Awal */}
            <div className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm">
              <div className="flex items-start gap-3 mb-2">
                <span className="w-5 h-5 text-blue-600 flex-shrink-0">🔍</span>
                <div>
                  <p className="font-bold text-blue-900 text-sm">Jaminan Transparansi 100% Gratis Cek Awal:</p>
                  <p className="text-blue-700 text-xs mt-1 leading-relaxed">
                    Unggah laporan penjualan Anda secara gratis. Cocokkan terlebih dahulu angka Total Omzet,
                    Potongan Biaya, dan Dana Bersih Cair dengan mutasi saldo toko Anda. Anda hanya perlu
                    membayar <span className="font-semibold">Rp 15.000</span> jika data awal terbukti akurat
                    dan Anda ingin membuka rincian harga jual baru anti-rugi serta file Excel Mass Update.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3 lencana keandalan */}
          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-slate-500 border-t border-slate-200 pt-6">
            <span>✓ Tanpa Daftar Akun</span>
            <span className="w-px h-px bg-slate-300 mx-1" />
            <span>✓ Privasi 100% Aman</span>
            <span className="w-px h-px bg-slate-300 mx-1" />
            <span>✓ Multi-Marketplace</span>
          </div>
        </div>
      </div>
    </section>
  )
}