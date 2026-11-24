'use client'

import { useState } from 'react'
import { FileSpreadsheet, AlertCircle, RefreshCw } from 'lucide-react'
import {
  parseExcelFile,
  smartMapHeaders,
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

  const handleRetryUpload = () => {
    setError(null)
    setFileName(null)
    setMappingInfo(null)
    document.getElementById('uploadFileInput')?.click()
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

    try {
      const { headers, records } = await parseExcelFile(file)
      const { mapping } = smartMapHeaders(headers, marketplace)
      setMappingInfo({ headers, mapping, mappedCount: Object.keys(mapping).length })
      await onFileProcessed(records, mapping, headers, file.name)
    } catch (err) {
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