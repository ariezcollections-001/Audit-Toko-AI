'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, Send, Mail, Sparkles, X, Loader2, CheckCircle } from 'lucide-react'
export default function AiChatWidget({ aiChatEnabled, aiCustomKnowledge, reportContext }) {
  const [configLoaded, setConfigLoaded] = useState(false)
  const [resolvedAiChatEnabled, setResolvedAiChatEnabled] = useState(true)
  const [resolvedAiCustomKnowledge, setResolvedAiCustomKnowledge] = useState('')

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/admin?action=config')
        if (res.ok) {
          const data = await res.json()
          setResolvedAiChatEnabled(data.aiChatEnabled !== false)
          setResolvedAiCustomKnowledge(data.aiCustomKnowledge || '')
        }
      } catch {}
      setConfigLoaded(true)
    }
    loadConfig()
  }, [])

  // Semua hook dipanggil tanpa kondisi (Rules of Hooks) sebelum return awal
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSupportForm, setShowSupportForm] = useState(false)
  const [supportMessage, setSupportMessage] = useState('')
  const [supportSubmitting, setSupportSubmitting] = useState(false)
  const [showSupportConfirmation, setShowSupportConfirmation] = useState(false)

  const MAX_MESSAGES = 10

  const messagesEndRef = useRef(null)

  // Scroll otomatis ke pesan terbaru setiap kali pesan, loading, atau pembukaan chat berubah
  useEffect(() => {
    // Tunggu sedikit agar DOM siap sebelum scroll
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 100)
    return () => clearTimeout(timer)
  }, [messages, isLoading, isOpen])

  const quickQuestions = [
    'Bagaimana cara unduh file laporan Excel dari Shopee / TikTok?',
    'Apakah data penjualan & HPP toko saya aman di sini?',
    'Apa saja yang saya dapatkan setelah membuka laporan Rp 15.000?',
  ]

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = {
        role: 'assistant',
        text:
          'Halo Kak! Saya Asisten AuditToko AI. Ada yang bisa dibantu Kak soal cara unduh laporan Excel atau hitungan profit toko Anda?',
      }
      setMessages([greeting])
    }
  }, [isOpen, messages.length])

  const addMessage = useCallback((role, text) => {
    setMessages((prev) => {
      const next = [...prev, { role, text }]
      if (next.length > MAX_MESSAGES) {
        return next.slice(-MAX_MESSAGES)
      }
      return next
    })
  }, [])

  // Jawaban cadangan lokal untuk 3 pertanyaan cepat utama jika GEMINI_API_KEY belum tersedia
  const getLocalAnswer = useCallback((text) => {
    const lower = text.toLowerCase()
    if (lower.includes('unduh file laporan excel') || lower.includes('cara unduh')) {
      return 'Untuk unduh laporan Kak: masuk ke Seller Center Shopee/TikTok Shop → menu Laporan/Penjualan → Detail Transaksi → pilih rentang waktu → format .xlsx → klik Unduh. Lalu unggah file tersebut ke AuditToko AI untuk dianalisis, ya Kak.'
    }
    if (lower.includes('aman') || lower.includes('keamanan') || lower.includes('data penjualan') || lower.includes('hpp')) {
      return 'Untuk Data aman Kak. Semua pemrosesan dilakukan secara lokal di browser Kakak—file laporan tidak diunggah ke server kami. Riwayat audit hanya tersimpan di localStorage perangkat Kakak, dapat dihapus kapan saja.'
    }
    if (lower.includes('apa saja yang saya dapatkan') || lower.includes('rp 15.000') || lower.includes('membuka laporan')) {
      return 'Setelah pembayaran Rp 15.000, Kakak akan mendapatkan: Ringkasan Laba Bersih Toko, Bedah Profit & Margin per produk, Simulasi Target Profit, Rekomendasi Harga Jual Baru (ending .900), dan File Excel Mass Update siap upload.'
    }
    return null
  }, [])

  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) return null

  const effectiveEnabled = aiChatEnabled !== undefined ? aiChatEnabled : resolvedAiChatEnabled
  const effectiveKnowledge = aiCustomKnowledge !== undefined ? aiCustomKnowledge : resolvedAiCustomKnowledge

  if (!configLoaded && aiChatEnabled === undefined) return null
  if (!effectiveEnabled) return null

  const handleSend = async (text) => {
    if (!text.trim()) return
    setError('')
    addMessage('user', text)
    setInputValue('')
    setIsLoading(true)

    // Coba jawaban lokal untuk 3 pertanyaan cepat utama
    const localAnswer = getLocalAnswer(text)
    if (localAnswer) {
      // Tunggu minimal 700ms agar spinner loading terlihat sebelum jawaban muncul
      setTimeout(() => {
        addMessage('assistant', localAnswer)
        setIsLoading(false)
      }, 700)
      return
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(-MAX_MESSAGES),
          userMessage: text,
          customKnowledge: effectiveKnowledge,
          reportContext: reportContext || null,
        }),
      })

      if (!res.ok) {
        throw new Error('Gagal menghubungi asisten AI')
      }

      const data = await res.json()
      addMessage('assistant', data.reply || 'Maaf, saya tidak dapat menjawab saat ini.')
    } catch (err) {
      const fallback =
        'Maaf Kak, asisten AI sedang tidak tersedia saat ini (API key belum dikonfigurasi di server). Anda tetap bisa mencoba fitur audit di website ini.'
      addMessage('assistant', fallback)
      setError(fallback)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (q) => {
    handleSend(q)
  }

  const handleOpenSupportForm = () => {
    setShowSupportForm(true)
    setShowSupportConfirmation(false)
  }

  const handleCloseSupportForm = () => {
    setShowSupportForm(false)
    setSupportMessage('')
    setShowSupportConfirmation(false)
  }

  const handleSupportSubmit = async (e) => {
    e.preventDefault()
    if (!supportMessage.trim()) return
    setSupportSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: '', message: supportMessage.trim() }),
      })
      if (!res.ok) throw new Error('Gagal mengirim pesan')
      setShowSupportForm(false)
      setSupportMessage('')
      setSupportSubmitting(false)
      setShowSupportConfirmation(true)
    } catch (err) {
      setError('Gagal mengirim pesan ke admin. Silakan coba lagi.')
      setSupportSubmitting(false)
    }
  }

  return (
    <>
      {/* Tombol Mengambang "Tanya Asisten AI" — TANPA backdrop-blur overlay di belakang */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold shadow-lg shadow-blue-600/40 transition-all transform hover:scale-105"
        aria-label={isOpen ? 'Tutup Tanya Asisten AI' : 'Buka Tanya Asisten AI'}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline text-shine">Tanya Asisten AI</span>
      </button>

      {/* Jendela Chat — posisi fixed di pojok kanan bawah, z-[9999] agar selalu paling atas, TANPA overlay blur full-screen */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-[9999] w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col h-[90vh] max-h-[700px]">
                {/* Header Chat */}
                <div className="flex items-center gap-2 px-6 py-4 bg-blue-50 border-b border-blue-100 rounded-t-2xl">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900 text-sm text-shine">Tanya Asisten AI</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="ml-auto text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Daftar Pesan */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  ref={idx === messages.length - 1 ? messagesEndRef : null}
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    m.role === 'user'
                      ? 'ml-auto bg-blue-600 text-white text-sm'
                      : 'mr-auto bg-slate-100 text-slate-800 text-sm'
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {error && (
                <div className="max-w-[85%] p-3 rounded-2xl bg-amber-50 text-amber-800 text-sm border border-amber-100 mr-auto">
                  {error}
                </div>
              )}
              {messages.length === 0 && (
                <div className="max-w-[85%] p-3 rounded-2xl bg-slate-100 text-slate-500 text-sm mr-auto italic">
                  Mulai obrolan dengan asisten AI…
                </div>
              )}
              {isLoading && (
                <div
                  ref={messagesEndRef}
                  className="max-w-[85%] p-3 rounded-2xl bg-slate-100 text-slate-800 text-sm mr-auto flex items-center gap-2 animate-pulse"
                >
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>Asisten AI mengetik…</span>
                </div>
              )}
            </div>

            {/* Tombol Pertanyaan Cepat */}
            {messages.length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2 px-1">
                  Pertanyaan Cepat
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuickQuestion(q)}
                      className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 font-medium hover:bg-slate-100 transition-colors whitespace-nowrap"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Kirim Pesan */}
            <div className="p-3 border-t border-slate-100 bg-white rounded-b-2xl flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                placeholder="Ketik pertanyaan kakak di sini…"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Deskripsi Kontak Admin + Tombol Kirim Pesan (tidak ada input email) */}
            {showSupportConfirmation ? (
              <div className="p-3 border-t border-emerald-100 bg-emerald-50 rounded-b-2xl flex flex-col items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <p className="text-xs text-emerald-800 text-center font-medium px-2">
                  Terima kasih! Pesan Anda telah masuk ke Kotak Masuk Admin dan akan segera kami tindak lanjuti.
                </p>
                <button
                  onClick={handleCloseSupportForm}
                  className="text-[10px] text-emerald-600 underline underline-offset-4 hover:text-emerald-800"
                >
                  Kirim pesan lainnya
                </button>
              </div>
            ) : (
              <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500 font-medium">
                    Sampaikan ke Admin Kami Jika Ada Kritik & Saran Ya Kak.
                  </span>
                  <button
                    onClick={handleOpenSupportForm}
                    className="ml-auto px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-semibold transition-colors"
                  >
                  Admin
                  </button>
                </div>

                {showSupportForm && (
                  <div className="mt-2">
                    <form onSubmit={handleSupportSubmit} className="space-y-2">
                      <div>
                        <textarea
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          rows={2}
                          placeholder="Tulis pesan kakak di sini…"
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={supportSubmitting || !supportMessage.trim()}
                          className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
                        >
                          {supportSubmitting ? 'Mengirim…' : 'Kirim'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseSupportForm}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

