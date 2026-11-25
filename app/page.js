'use client'

import { useState, useCallback, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import Header from './components/Header'
import UploadSection from './components/UploadSection'
import ResultsSection from './components/ResultsSection'
import Footer from './components/Footer'
import AuditHistoryList from './components/AuditHistoryList'
import { calculateAnalysis, smartMapHeaders, formatRupiah } from './lib/analysis'
import './globals.css'

const HISTORY_KEY = 'audit_history_list'
const MAX_HISTORY = 10

export default function Home() {
  // View state: 'home' (Tampilan 1) | 'results' (Tampilan 2)
  const [view, setView] = useState('home')

  // Analysis state
  const [analysisResult, setAnalysisResult] = useState(null)
  const [fileData, setFileData] = useState(null)
  const [detectedFormat, setDetectedFormat] = useState(null)

  // Config state
  const [marketplace, setMarketplace] = useState('auto')
  const [hppInputs, setHppInputs] = useState({})
  const [targetProfit, setTargetProfit] = useState(0.15)
  const [packingCost, setPackingCost] = useState(2000)
  const [adCost, setAdCost] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const [paid, setPaid] = useState(false)

  /**
   * Normalisasi objek hasil calculateAnalysis agar struktur properti 100% sama
   * persis dengan objek yang dimuat dari Riwayat Audit (handleLoadHistory).
   * Dipakai di semua tempat yang memanggil setAnalysisResult agar upload langsung
   * tidak menampilkan Rp 0 detik pertama.
   */
  const normalizeAnalysisResult = (result) => ({
    summary: result.summary,
    products: result.products,
    lossProducts: result.lossProducts || [],
    fakeStarProducts: result.fakeStarProducts || [],
    claims: result.claims || [],
    returnedOrders: result.returnedOrders || [],
    detectedColumns: result.detectedColumns || [],
    hasOrderIdColumn: result.hasOrderIdColumn ?? true,
  })

  // Upload loading state (dikelola di page.js agar popup tahan selama transisi view)
  const [showUploadLoading, setShowUploadLoading] = useState(false)
  const [uploadStartTime, setUploadStartTime] = useState(null)
  const MIN_UPLOAD_DISPLAY_MS = 2500

  // History state
  const [auditHistory, setAuditHistory] = useState([])
  const [activeHistoryId, setActiveHistoryId] = useState(null)
  const [isAlreadyPaid, setIsAlreadyPaid] = useState(false)

  // Modal states
  const [caraKerjaOpen, setCaraKerjaOpen] = useState(false)
  const [hargaOpen, setHargaOpen] = useState(false)
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)
  const [downloadGuideModalOpen, setDownloadGuideModalOpen] = useState(false)

  // Load history dari localStorage saat mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setAuditHistory(parsed)
      }
    } catch {}
  }, [])

  // Selalu mulai dari paling atas halaman saat buka awal atau refresh (Ctrl+R / F5)
  useEffect(() => {
    window.history.replaceState(null, '', window.location.pathname)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Simpan history ke localStorage setiap kali berubah
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(auditHistory))
    } catch {}
  }, [auditHistory])

  const handleFileProcessed = useCallback(
    async (records, mapping, headers, fileName) => {
      setShowUploadLoading(true)
      setUploadStartTime(Date.now())

      try {
        setFileData({ fileName, headers, records, mapping })
        setDetectedFormat(marketplace === 'auto' ? 'Terdeteksi Otomatis' : marketplace)
        const result = calculateAnalysis(records, mapping, hppInputs, marketplace, targetProfit, packingCost, adCost)

        // === Zero-Safety Trigger di page.js (pelindung terakhir sebelum ResultsSection) ===
        // Jika ada baris data namun total omzet kotor atau total dana cair <= 0,
        // JANGAN lanjut ke halaman hasil Rp 0. Lempar sinyal agar UploadSection
        // menampilkan kotak kuning Fallback Manual Mapping.
        if (records.length > 0 &&
            (result.summary.totalGross <= 0 || result.summary.settlementAmount <= 0)) {
          throw new Error('ZERO_SAFETY_TRIGGERED')
        }

        setAnalysisResult(normalizeAnalysisResult(result))

        // Simpan ke riwayat otomatis
        const totalSettlement = result.summary?.settlementAmount || 0
        const name = fileName || 'laporan-penjualan.xlsx'

        // Cek apakah file sama sudah pernah dibayar (isPaid: true)
        const existingPaid = auditHistory.find(
          (h) => h.fileName === name &&
                 h.summary?.settlementAmount === totalSettlement &&
                 h.isPaid === true
        )

        const historyEntry = {
          id: Date.now().toString(),
          fileName: name,
          uploadedAt: new Date().toISOString(),
          summary: result.summary,
          products: result.products,
          hppMap: hppInputs,
          packingCost,
          targetProfit,
          isPaid: !!existingPaid,
        }

        setIsAlreadyPaid(!!existingPaid)
        setUnlocked(!!existingPaid || unlocked)
        setPaid(!!existingPaid || paid)

        const newHistory = [historyEntry, ...auditHistory].slice(0, MAX_HISTORY)
        setAuditHistory(newHistory)
        setActiveHistoryId(historyEntry.id)

        // Tunggu minimal MIN_UPLOAD_DISPLAY_MS agar popup loading tidak terlalu cepat hilang
        const elapsed = Date.now() - uploadStartTime
        const remaining = Math.max(0, MIN_UPLOAD_DISPLAY_MS - elapsed)
        await new Promise((resolve) => setTimeout(resolve, remaining))

        setView('results')
        // setShowUploadLoading(false) dipindahkan ke useEffect di bawah agar
        // popup tidak hilang sebelum sempat terlihat saat transisi view
      } catch (err) {
        console.error('Gagal memproses file:', err)
        setShowUploadLoading(false)
        throw err
      }
    },
    [marketplace, targetProfit, packingCost, hppInputs, unlocked, paid, auditHistory, fileData]
  )

  const handleLoadHistory = useCallback((id) => {
    const item = auditHistory.find((h) => h.id === id)
    if (!item) return

    setAnalysisResult({
      summary: item.summary,
      products: item.products,
      lossProducts: item.lossProducts || [],
      fakeStarProducts: item.fakeStarProducts || [],
      claims: item.claims || [],
      returnedOrders: item.returnedOrders || [],
      detectedColumns: item.detectedColumns || [],
      hasOrderIdColumn: item.hasOrderIdColumn ?? true,
    })
    setFileData({ fileName: item.fileName })
    setHppInputs(item.hppMap || {})
    setTargetProfit(item.targetProfit || 0.15)
    setPackingCost(item.packingCost || 2000)
    setUnlocked(item.isPaid === true)
    setPaid(item.isPaid === true)
    setIsAlreadyPaid(item.isPaid === true)
    setActiveHistoryId(id)
    setView('results')
  }, [auditHistory])

  const handleDeleteHistory = useCallback((id) => {
    setAuditHistory((prev) => prev.filter((h) => h.id !== id))
    if (activeHistoryId === id) {
      setActiveHistoryId(null)
      setView('home')
    }
  }, [activeHistoryId])

  const handleClearAllHistory = useCallback(() => {
    setAuditHistory([])
    setActiveHistoryId(null)
    setView('home')
  }, [])

  const handleUpdateHistory = useCallback((id, updates) => {
    setAuditHistory((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
    )
  }, [])

  const handleBackToHome = useCallback(() => {
    setView('home')
    setActiveHistoryId(null)
    setIsAlreadyPaid(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleBerandaClick = useCallback(() => {
    setView('home')
    setActiveHistoryId(null)
    setAnalysisResult(null)
    setFileData(null)
    setIsAlreadyPaid(false)
    setUnlocked(false)
    setPaid(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleMulaiAnalisisClick = useCallback(() => {
    setView('home')
    setActiveHistoryId(null)
    setIsAlreadyPaid(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => {
      const el = document.getElementById('mulai-analisis')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  const handleHppFileUpload = useCallback(
    async (hppMap) => {
      // hppMap dari parseHppFile berupa { namaProduk: harga }
      // Normalisasi kunci agar cocok dengan productKey di calculateAnalysis:
      // productKey = productName.toLowerCase().replace(/\s+/g, ' ')
      const normalized = {}
      for (const [name, price] of Object.entries(hppMap || {})) {
        const key = String(name).toLowerCase().replace(/\s+/g, ' ').trim()
        if (key) normalized[key] = Number(price) || 0
      }
      setHppInputs(normalized)
      setUnlocked(true)

      // Re-run analisis dengan HPP baru jika sudah ada data penjualan
      if (fileData?.records && fileData?.headers) {
        const mapping = fileData.mapping || smartMapHeaders(fileData.headers, marketplace)
        const result = calculateAnalysis(
          fileData.records,
          mapping,
          normalized,
          marketplace,
          targetProfit,
          packingCost,
          adCost
        )
        setAnalysisResult(normalizeAnalysisResult(result))
      }

      if (activeHistoryId) {
        handleUpdateHistory(activeHistoryId, {
          isPaid: true,
          paid: true,
          hppMap: normalized,
        })
      }
    },
    [activeHistoryId, handleUpdateHistory, fileData, marketplace, targetProfit, packingCost]
  )

  const handleHppChange = useCallback(
    (productKey, newHpp) => {
      const next = { ...hppInputs, [productKey]: newHpp }

      setHppInputs(next)
      if (activeHistoryId) {
        handleUpdateHistory(activeHistoryId, { hppMap: next, isPaid: true })
      }

      // Re-run analisis dengan HPP baru jika sudah ada data penjualan
      if (fileData?.records && fileData?.headers) {
        const mapping = fileData.mapping || smartMapHeaders(fileData.headers, marketplace)
        const result = calculateAnalysis(
          fileData.records,
          mapping,
          next,
          marketplace,
          targetProfit,
          packingCost,
          adCost
        )
        setAnalysisResult(normalizeAnalysisResult(result))
      }
    },
    [activeHistoryId, handleUpdateHistory, fileData, marketplace, targetProfit, packingCost, hppInputs]
  )

  // Re-run analisis saat HPP, target profit, atau packing cost berubah
  useEffect(() => {
    if (!fileData?.records || !fileData?.headers) return
    const mapping = fileData.mapping || smartMapHeaders(fileData.headers, marketplace)
    const result = calculateAnalysis(
      fileData.records,
      mapping,
      hppInputs,
      marketplace,
      targetProfit,
      packingCost,
      adCost
    )
    setAnalysisResult(normalizeAnalysisResult(result))
  }, [hppInputs, targetProfit, packingCost, marketplace, fileData])

  // Sembunyikan popup loading setelah view berubah ke 'results'
  // Agar popup tetap terlihat minimal 2.5 detik selama transisi
  useEffect(() => {
    if (view === 'results' && showUploadLoading) {
      const timer = setTimeout(() => {
        setShowUploadLoading(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [view, showUploadLoading])

  return (
    <>
      <Header
        view={view}
        historyCount={auditHistory.length}
        onHistoryClick={() => {
          setView('home')
          setActiveHistoryId(null)
        }}
        onCaraKerjaClick={() => setCaraKerjaOpen(true)}
        onHargaClick={() => setHargaOpen(true)}
        onBackToHome={handleBackToHome}
        onLogoClick={handleBerandaClick}
      />

      {/* Popup Loading Upload (dikelola di page.js agar tahan selama transisi view) */}
      {showUploadLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl border border-emerald-100 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">
                  Sedang Memproses File Excel…
                </p>
                <p className="text-sm text-slate-500">
                  Mengaudit data transaksi & pesanan retur…
                </p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full animate-pulse"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'home' ? (
        <>
          <main className="pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                  AuditToko AI
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  Audit profit, deteksi produk rugi, dan rekomendasi harga jual baru otomatis
                  dari laporan penjualan Shopee, TikTok Shop,
                  Tokopedia, Lazada, &amp; Bukalapak.
                </p>
              </div>

              <UploadSection
                marketplace={marketplace}
                onFileProcessed={handleFileProcessed}
                onHppFileUpload={handleHppFileUpload}
                detectedFormat={detectedFormat}
              />

              <AuditHistoryList
                history={auditHistory}
                onLoadHistory={handleLoadHistory}
                onDeleteHistory={handleDeleteHistory}
                onClearAllHistory={handleClearAllHistory}
              />
            </div>
          </main>

          <Footer
            onPrivacyClick={() => setPrivacyModalOpen(true)}
            onDownloadGuideClick={() => setDownloadGuideModalOpen(true)}
            onBerandaClick={handleBerandaClick}
            onLogoClick={handleBerandaClick}
            onCaraKerjaClick={() => setCaraKerjaOpen(true)}
            onHargaClick={() => setHargaOpen(true)}
            onMulaiAnalisisClick={handleMulaiAnalisisClick}
          />
        </>
      ) : (
        <>
          <main className="pt-24 pb-12 min-h-[calc(100vh-200px)]">
            <ResultsSection
              summary={analysisResult?.summary}
              products={analysisResult?.products || []}
              lossProducts={analysisResult?.lossProducts || []}
              fakeStarProducts={analysisResult?.fakeStarProducts || []}
              claims={analysisResult?.claims || []}
              returnedOrders={analysisResult?.returnedOrders || []}
              detectedColumns={analysisResult?.detectedColumns || []}
              hasOrderIdColumn={analysisResult?.hasOrderIdColumn ?? true}
              unlocked={unlocked}
              setUnlocked={setUnlocked}
              setPaid={setPaid}
              hppInputs={hppInputs}
              setHppInputs={setHppInputs}
              onHppChange={handleHppChange}
              onHppFileUpload={handleHppFileUpload}
              targetProfit={targetProfit}
              setTargetProfit={setTargetProfit}
              packingCost={packingCost}
              setPackingCost={setPackingCost}
              onBackToHome={handleBackToHome}
              isAlreadyPaid={isAlreadyPaid}
              isPaid={paid}
              onUpdateHistory={handleUpdateHistory}
              historyId={activeHistoryId}
              adCost={adCost}
              onAdCostChange={setAdCost}
            />
          </main>
        </>)
      }

      {/* Modal: Cara Kerja */}
      {caraKerjaOpen && (
        <div className="modal-overlay" onClick={() => setCaraKerjaOpen(false)}>
          <div
            className="modal-content glass-card rounded-3xl p-8 max-w-lg mx-auto mt-20 shadow-2xl border border-slate-200/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setCaraKerjaOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <svg className="w-6 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Cara Kerja AuditToko AI</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Ikuti 3 langkah mudah untuk menganalisis profit toko marketplace Anda.
            </p>
            <ol className="space-y-4 text-sm text-slate-600 mb-6">
              <li className="flex gap-3">
                <span className="text-slate-400 font-bold">1.</span>
                <span>Unggah laporan penjualan (.xlsx/.csv) dari Seller Center marketplace Anda.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-slate-400 font-bold">2.</span>
                <span>Kami analisis otomatis: deteksi produk rugi, hitung kebocoran profit, dan sediakan rekomendasi harga jual baru yang optimal.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-slate-400 font-bold">3.</span>
                <span>Buka laporan lengkap, unduh file Mass Update Harga, dan terapkan rekomendasi harga jual baru.</span>
              </li>
            </ol>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700">
              <p className="font-medium mb-2">? Semua pemrosesan data dilakukan secara lokal di browser Anda</p>
              <p className="font-medium">? File laporan tidak diupload ke server kami</p>
            </div>
            <button onClick={() => setCaraKerjaOpen(false)} className="mt-4 btn-outline w-full py-3 rounded-xl font-semibold text-slate-700">
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Modal: Harga */}
      {hargaOpen && (
        <div className="modal-overlay" onClick={() => setHargaOpen(false)}>
          <div
            className="modal-content glass-card rounded-3xl p-8 max-w-lg mx-auto mt-20 shadow-2xl border border-slate-200/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setHargaOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <svg className="w-6 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Transparansi Harga</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Cek ringkasan analisis secara gratis. Buka kunci file perbaikan dan
              rekomendasi harga jual optimal dengan biaya satu kali.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600 text-sm">Cek Ringkasan Profit</span>
                <span className="text-emerald-600 font-semibold text-sm">Gratis</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-amber-700 text-sm">Buka Laporan Lengkap + File Perbaikan</span>
                <span className="text-amber-700 font-semibold text-sm">Rp 15.000</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              
            </p>
            <button onClick={() => setHargaOpen(false)} className="mt-4 btn-outline w-full py-3 rounded-xl font-semibold text-slate-700">
              Tutup
            </button>
          </div>
        </div>
      )}


      {/* Modal: Privasi */}
      {privacyModalOpen && (
        <div className="modal-overlay" onClick={() => setPrivacyModalOpen(false)}>
          <div className="modal-content glass-card rounded-3xl p-8 max-w-lg mx-auto mt-20 shadow-2xl border border-slate-200/50" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPrivacyModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors">
              <svg className="w-6 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Kebijakan Privasi &amp; Keamanan Data</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Data Anda aman dengan kami. Berikut ini komitmen privasi kami:
            </p>
            <ul className="space-y-3 text-sm text-slate-600 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-emerald-500">?</span>
                Pemrosesan data dilakukan secara lokal di browser Anda
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500">?</span>
                File laporan tidak diupload ke server kami
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500">?</span>
                Tidak ada data pribadi yang disimpan atau dibagikan
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500">?</span>
                Riwayat audit hanya disimpan di localStorage perangkat Anda, dapat dihapus kapan saja
              </li>
            </ul>
            <button onClick={() => setPrivacyModalOpen(false)} className="btn-outline w-full py-3 rounded-xl font-semibold text-slate-700">
              Saya Mengerti
            </button>
          </div>
        </div>
      )}


      {/* Modal: Panduan Download */}
      {downloadGuideModalOpen && (
        <div className="modal-overlay" onClick={() => setDownloadGuideModalOpen(false)}>
          <div className="modal-content glass-card rounded-3xl p-8 max-w-lg mx-auto mt-20 shadow-2xl border border-slate-200/50" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDownloadGuideModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors">
              <svg className="w-6 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Cara Download Laporan Marketplace</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Ikuti langkah berikut untuk mendapatkan file laporan yang bisa dianalisis oleh AuditToko AI:
            </p>
            <ol className="space-y-4 text-sm text-slate-600 mb-6">
              <li className="flex gap-3">
                <span className="text-slate-400 font-bold">1.</span>
                Masuk ke Seller Center Shopee / TikTok Shop / Tokopedia / Lazada / Bukalapak
              </li>
              <li className="flex gap-3">
                <span className="text-slate-400 font-bold">2.</span>
                Buka menu Laporan � Penjualan � Detail Transaksi
              </li>
              <li className="flex gap-3">
                <span className="text-slate-400 font-bold">3.</span>
                Pilih rentang waktu dan format file .xlsx atau .csv
              </li>
              <li className="flex gap-3">
                <span className="text-slate-400 font-bold">4.</span>
                Klik Unduh dan unggah file tersebut ke AuditToko AI
              </li>
            </ol>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
              ?? Pastikan file berisi kolom: nomor pesanan, nama produk, jumlah terjual,
              harga jual, HPP (jika tersedia), dan total penghasilan/settlement.
            </div>
            <button onClick={() => setDownloadGuideModalOpen(false)} className="mt-4 btn-outline w-full py-3 rounded-xl font-semibold text-slate-700">
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

    </>
  )
}
