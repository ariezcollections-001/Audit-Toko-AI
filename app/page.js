'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import Header from './components/Header'
import BrandLogo from './components/BrandLogo'
import UploadSection from './components/UploadSection'
import ResultsSection from './components/ResultsSection'
import Footer from './components/Footer'
import AuditHistoryList from './components/AuditHistoryList'
import { calculateAnalysis, smartMapHeaders, formatRupiah } from './lib/analysis'
import './globals.css'

const HISTORY_KEY = 'audit_history_list'
const MAX_HISTORY = 10
const SESSION_PROGRESS_KEY = 'audit_session_progress'
const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 jam penuh

export default function Home() {
  // View state: 'home' (Tampilan 1) | 'results' (Tampilan 2)
  // Di-persist ke localStorage agar tidak kembali ke beranda saat refresh
  // Diinisialisasi 'home' agar konsisten antara server dan client saat SSR/hydrasi.
  // Nilai dari localStorage di-sinkronkan setelah montase via useEffect di bawah.
  const [view, setView] = useState('home')
  // isHydrated digunakan agar selama hydrasi (pertama kali client render)
  // konten menampilkan skeleton yang sama antara server dan client,
  // menghindari flash halaman beranda sebelum pindah ke view yang benar.
  const [isHydrated, setIsHydrated] = useState(false)

  // Baca view yang disimpan dari localStorage setelah komponen montase (client only)
  // agar tidak terjadi hydration mismatch saat refresh halaman.
  // Safety timeout memastikan spinner tidak putar terus jika useEffect terlambat.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('audit_view')
      if (saved === 'results') setView('results')
    } catch {}

    const timer = setTimeout(() => setIsHydrated(true), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    try { localStorage.setItem('audit_view', view) } catch {}
  }, [view])

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

  // Admin config state
  const [adminConfig, setAdminConfig] = useState({
    brandName: 'AuditToko AI',
    brandLogoUrl: '',
    auditPrice: 15000,
    maintenanceMode: false,
    bannerEnabled: false,
    bannerType: 'text',
    bannerText: '',
    bannerColor: 'blue',
    bannerImageUrl: '',
    bannerLink: '',
    bannerEffect: 'shimmer',
    aiChatEnabled: true,
    aiCustomKnowledge: '',
  })
  const [adminConfigLoaded, setAdminConfigLoaded] = useState(false)

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
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false)
  const [activeHistoryId, setActiveHistoryId] = useState(null)
  const [isAlreadyPaid, setIsAlreadyPaid] = useState(false)
  const [expiresAt, setExpiresAt] = useState(null)
  const isRestoringRef = useRef(false)

  // Modal states
  const [caraKerjaOpen, setCaraKerjaOpen] = useState(false)
  const [hargaOpen, setHargaOpen] = useState(false)
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)
  const [downloadGuideModalOpen, setDownloadGuideModalOpen] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Selalu scroll ke paling atas saat halaman di-refresh atau dimuat ulang
  // (baik halaman beranda maupun halaman hasil analisis)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  // Saat berpindah antar view (beranda <-> hasil analisis), selalu kembali ke paling atas
  // agar tampilan awal konsisten setelah upload berhasil atau kembali ke beranda
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [view])

  // Load history dari localStorage saat mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          const now = Date.now()
          const filtered = parsed.filter((item) => {
            const expiresAt = item.expiresAt || (item.createdAt ? item.createdAt + SESSION_TTL_MS : 0)
            return now < expiresAt
          })
          // Simpan kembali hasil saringan ke localStorage
          localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered))
          setAuditHistory(filtered)
        }
      }
    } catch {}
    setIsHistoryLoaded(true)
  }, [])

  // Load admin config dari /api/admin (brandName, logo, auditPrice, maintenanceMode, dll.)
  useEffect(() => {
    let mounted = true
    const loadAdminConfig = async () => {
      try {
        const res = await fetch('/api/admin?action=config&public=1&t=' + Date.now(), { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (mounted) {
            setAdminConfig({
              brandName: data.brandName || 'AuditToko AI',
              brandLogoUrl: data.brandLogoUrl || '',
              auditPrice: data.auditPrice ?? 15000,
              maintenanceMode: data.maintenanceMode === true,
              bannerEnabled: data.bannerEnabled === true,
              bannerType: data.bannerType || 'text',
              bannerText: data.bannerText || '',
              bannerColor: data.bannerColor || 'blue',
              bannerImageUrl: data.bannerImageUrl || '',
              bannerLink: data.bannerLink || '',
              aiChatEnabled: data.aiChatEnabled !== false,
              aiCustomKnowledge: data.aiCustomKnowledge || '',
            })
            setAdminConfigLoaded(true)

            // Catat kunjungan halaman ke admin analytics (senyap di latar belakang)
            await fetch('/api/admin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'recordEvent',
                type: 'visits',
                payload: { page: '/', source: 'direct' },
              }),
            }).catch(() => {})
          }
        }
      } catch {
        if (mounted) setAdminConfigLoaded(true)
      }
    }
    loadAdminConfig()
    return () => { mounted = false }
  }, [])

  // Load progres sesi (HPP, Packing, Iklan, Status Lunas) dari localStorage saat mount
  // Hanya di-restor jika belum melewati expiresAt (24 jam sejak upload pertama)
  useEffect(() => {
    const now = Date.now()
    try {
      const saved = localStorage.getItem(SESSION_PROGRESS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.expiresAt && now < parsed.expiresAt && !isRestoringRef.current) {
          isRestoringRef.current = true
          setExpiresAt(parsed.expiresAt)
          setHppInputs(parsed.hppInputs || {})
          setPackingCost(parsed.packingCost || 2000)
          setAdCost(parsed.adCost || 0)
          setTargetProfit(parsed.targetProfit || 0.15)
          setUnlocked(parsed.unlocked || false)
          setPaid(parsed.paid || false)
          setIsAlreadyPaid(parsed.isAlreadyPaid || false)
        } else if (parsed.expiresAt && now >= parsed.expiresAt) {
          localStorage.removeItem(SESSION_PROGRESS_KEY)
        }
      }
    } catch {}
  }, [])

  // Simpan history ke localStorage setiap kali berubah
  useEffect(() => {
    if (!isHistoryLoaded) return
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(auditHistory))
    } catch {}
  }, [auditHistory, isHistoryLoaded])

  // Simpan progres sesi (HPP, Packing, Iklan, Status Lunas, Target Profit) ke localStorage
  // setiap kali nilai berubah. createdAt & expiresAt di-set hanya sekali di handleFileProcessed,
  // jadi tidak di-reset saat pengguna hanya mengedit input.
  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false
      return
    }
    try {
      const saved = localStorage.getItem(SESSION_PROGRESS_KEY)
      let existing = { createdAt: null, expiresAt: null }
      if (saved) {
        try { existing = JSON.parse(saved) } catch {}
      }
      const progress = {
        createdAt: existing.createdAt || Date.now(),
        expiresAt: existing.expiresAt || Date.now() + SESSION_TTL_MS,
        hppInputs,
        packingCost,
        adCost,
        targetProfit,
        unlocked,
        paid,
        isAlreadyPaid,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(SESSION_PROGRESS_KEY, JSON.stringify(progress))
    } catch {}
  }, [hppInputs, packingCost, adCost, targetProfit, unlocked, paid, isAlreadyPaid])

  // Simpan packingCost ke history aktif saat berubah (dengan preservasi createdAt/expiresAt)
  useEffect(() => {
    if (!isHistoryLoaded || !activeHistoryId) return
    try {
      setAuditHistory((prev) =>
        prev.map((h) =>
          h.id === activeHistoryId
            ? { ...h, packingCost, createdAt: h.createdAt, expiresAt: h.expiresAt }
            : h
        )
      )
    } catch {}
  }, [packingCost, activeHistoryId, isHistoryLoaded])

  // Simpan adCost ke history aktif saat berubah (dengan preservasi createdAt/expiresAt)
  useEffect(() => {
    if (!isHistoryLoaded || !activeHistoryId) return
    try {
      setAuditHistory((prev) =>
        prev.map((h) =>
          h.id === activeHistoryId
            ? { ...h, adCost, createdAt: h.createdAt, expiresAt: h.expiresAt }
            : h
        )
      )
    } catch {}
  }, [adCost, activeHistoryId, isHistoryLoaded])

  // Deteksi lewat 24 jam sejak upload pertama (expiresAt) setiap 30 detik.
  // Jika Date.now() >= expiresAt, hapus seluruh progres dari localStorage
  // dan reset state agar pelanggan memulai sesi baru.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      try {
        const saved = localStorage.getItem(SESSION_PROGRESS_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.expiresAt && now >= parsed.expiresAt) {
            localStorage.removeItem(SESSION_PROGRESS_KEY)
            setExpiresAt(null)
            setHppInputs({})
            setPackingCost(2000)
            setAdCost(0)
            setTargetProfit(0.15)
            setUnlocked(false)
            setPaid(false)
            setIsAlreadyPaid(false)
            setAnalysisResult(null)
            setFileData(null)
            setAuditHistory([])
            setActiveHistoryId(null)
            setView('home')
          }
        }
      } catch {}
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleFileProcessed = useCallback(
    async (records, mapping, headers, fileName, requiredColumnConfidence = {}) => {
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

        // === Strict Confidence Check di page.js (lapisan pertahanan kedua) ===
        // Jika kolom wajib (productPrice / settlementAmount) confidence < 80,
        // jangan terima hasil analisis—lempar sinyal agar UploadSection
        // menampilkan kotak kuning Fallback Manual Mapping.
        const requiredConfidenceBelowThreshold =
          (requiredColumnConfidence.productPrice !== undefined && requiredColumnConfidence.productPrice < 80) ||
          (requiredColumnConfidence.settlementAmount !== undefined && requiredColumnConfidence.settlementAmount < 80)

        if (records.length > 0 && requiredConfidenceBelowThreshold) {
          throw new Error('ZERO_SAFETY_TRIGGERED')
        }

        setAnalysisResult(normalizeAnalysisResult(result))

        // Set createdAt & expiresAt (24 jam sejak upload pertama) di localStorage
        // Tidak di-reset saat pengguna hanya mengedit input HPP/Packing/Iklan.
        const now = Date.now()
        setExpiresAt(now + SESSION_TTL_MS)
        try {
          const existing = localStorage.getItem(SESSION_PROGRESS_KEY)
          let parsed = { createdAt: null, expiresAt: null }
          if (existing) {
            try { parsed = JSON.parse(existing) } catch {}
          }
          localStorage.setItem(SESSION_PROGRESS_KEY, JSON.stringify({
            createdAt: parsed.createdAt || now,
            expiresAt: parsed.expiresAt || now + SESSION_TTL_MS,
            hppInputs,
            packingCost,
            adCost,
            targetProfit,
            unlocked,
            paid,
            isAlreadyPaid,
            updatedAt: new Date().toISOString(),
          }))
        } catch {}

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
          id: now.toString(),
          fileName: name,
          uploadedAt: new Date().toISOString(),
          createdAt: now,
          expiresAt: now + SESSION_TTL_MS,
          summary: result.summary,
          products: result.products,
          hppMap: hppInputs,
          packingCost,
          adCost,
          targetProfit,
          isPaid: !!existingPaid,
        }

        setIsAlreadyPaid(!!existingPaid)
        setUnlocked(false)
        setPaid(false)

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

    // Perpanjang sesi 24 jam saat membuka riwayat lama
    try {
      const saved = localStorage.getItem(SESSION_PROGRESS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          setExpiresAt(parsed.expiresAt)
        } else {
          setExpiresAt(Date.now() + SESSION_TTL_MS)
        }
      } else {
        setExpiresAt(Date.now() + SESSION_TTL_MS)
      }
    } catch {
      setExpiresAt(Date.now() + SESSION_TTL_MS)
    }

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
    setAnalysisResult(null)
    setFileData(null)
    setIsAlreadyPaid(false)
    setUnlocked(false)
    setPaid(false)
  }, [])

  const handleDeleteSelectedHistory = useCallback((ids) => {
    setAuditHistory((prev) => prev.filter((h) => !ids.includes(h.id)))
    if (activeHistoryId && ids.includes(activeHistoryId)) {
      setActiveHistoryId(null)
      setView('home')
      setAnalysisResult(null)
      setFileData(null)
      setIsAlreadyPaid(false)
      setUnlocked(false)
      setPaid(false)
    }
  }, [activeHistoryId])

  const handleUpdateHistory = useCallback((id, updates) => {
    setAuditHistory((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h
        // Selalu preservasi createdAt dan expiresAt asli
        const { createdAt, expiresAt, ...restUpdates } = updates
        return { ...h, ...restUpdates, createdAt: h.createdAt, expiresAt: h.expiresAt }
      })
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

  const handleOpenHistoryModal = useCallback(() => {
    setShowHistoryModal(true)
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
      {/* Mode Maintenance — kunci area upload jika aktif */}
      {adminConfig.maintenanceMode && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.739-3.018l-.408-1.017c-.465-1.17-1.584-1.794-2.597-1.425l-1.145.416a3.13 3.13 0 01-3.424-.237l-.745-1.195a.75.75 0 01.282-1.002l.745-.745c.121-.121.182-.291.218-.477l.004-.225c.002-.095.015-.19.015-.288V10.5c0-1.121-.897-2.018-2-2.182a2 2 0 00-.281-.058c-.21-.04-.432-.065-.65-.065L6.05 4.75c-.218 0-.44.025-.65.065a2 2 0 00-.281.058c-1.103.164-1.997 1.062-1.997 2.182v7.35c0 .098.013.193.015.288l.004.225c.036.186.097.356.218.477l.745.745c.097.097.146.266.282.347l.745 1.195c.227.364.487.722.795 1.042l1.145-.416c1.013-.369 2.132-.255 2.597 1.425l.408 1.017c-.763 1.351-.198 3.018 1.739 3.018z" /></svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Situs Dalam Pemeliharaan</h2>
            <p className="text-slate-300 mb-6">
              Website AuditToko AI sedang dalam mode pemeliharaan. Silakan coba lagi nanti.
            </p>
            <p className="text-sm text-slate-400">
              Admin: {adminConfig.brandName || 'AuditToko AI'}
            </p>
          </div>
        </div>
      )}

      <Header
        view={view}
        historyCount={auditHistory.length}
        onOpenHistoryModal={handleOpenHistoryModal}
        onCaraKerjaClick={() => setCaraKerjaOpen(true)}
        onHargaClick={() => setHargaOpen(true)}
        onBackToHome={handleBackToHome}
        onLogoClick={handleBerandaClick}
        adminConfig={adminConfig}
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

      {!isHydrated ? (
        <div className="min-h-screen flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
            <p className="text-slate-600">Memuat halaman…</p>
          </div>
        </div>
      ) : view === 'home' ? (
        <>
          <main className="pt-8 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <div className="flex justify-center mb-4">
                  <BrandLogo className="" height={40} width={40} />
                </div>
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
            </div>
          </main>

          <Footer
            brandName={adminConfig?.brandName || 'AuditToko AI'}
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
          <main className={`${adminConfig?.bannerEnabled === true ? 'pt-1' : 'pt-2'} pb-12`}>
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
              adminConfig={adminConfig}
              onRecordEvent={async (type, payload) => {
                try {
                  await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'recordEvent', type, payload }),
                  })
                } catch {}
              }}
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
              <p className="font-medium mb-2 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                Semua pemrosesan data dilakukan secara lokal di browser Anda
              </p>
              <p className="font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                File laporan tidak diupload ke server kami
              </p>
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
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 flex-shrink-0">✓</span>
                Cek Ringkasan Analisis = Gratis.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 flex-shrink-0">✓</span>
                Buka kunci file perbaikan &amp; rekomendasi harga yang optimal.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 flex-shrink-0">✓</span>
                Cukup 1x bayar, Tanpa Biaya Langganan Bulanan
              </li>
            </ul>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600 text-sm">Cek Ringkasan Profit</span>
                <span className="text-emerald-600 font-semibold text-sm">Gratis</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-amber-700 text-sm">Buka Laporan Lengkap + Recomendasi Harga</span>
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

      {/* Modal: Riwayat Audit 24 Jam */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content glass-card rounded-3xl p-8 max-w-2xl mx-auto mt-20 shadow-2xl border border-slate-200/50" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowHistoryModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors">
              <svg className="w-6 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Riwayat Audit 24 Jam</h3>
            <p className="text-amber-800 text-sm font-medium mb-6">
              ⏰ Progres input HPP & status laporan tersimpan otomatis selama 24 jam sejak mulai audit. Riwayat akan terhapus otomatis setelah 24 jam.
            </p>
            <div className="max-h-[340px] overflow-y-auto pr-1 space-y-2.5 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <AuditHistoryList
                history={auditHistory}
                onLoadHistory={(id) => {
                  setShowHistoryModal(false)
                  handleLoadHistory(id)
                }}
                onDeleteHistory={handleDeleteHistory}
                onDeleteSelectedHistory={handleDeleteSelectedHistory}
                onClearAllHistory={handleClearAllHistory}
              />
            </div>
            {auditHistory.length === 0 && (
              <p className="text-sm text-slate-500 text-center mt-8">Belum ada riwayat audit di perangkat ini.</p>
            )}
          </div>
        </div>
      )}

    </>
  )
}
