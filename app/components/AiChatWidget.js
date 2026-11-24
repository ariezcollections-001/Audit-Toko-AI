'use client'

import { useState, useCallback, useEffect } from 'react'
import { MessageCircle, Send, Mail, Sparkles, X } from 'lucide-react'

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const MAX_MESSAGES = 10

  const quickQuestions = [
    'Cara unduh laporan Shopee?',
    'Kenapa laba bersih saya segini?',
    'Format file saya belum terbaca',
  ]

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = {
        role: 'assistant',
        text:
          'Halo! Saya Asisten AuditToko AI. Ada yang bisa dibantu soal cara unduh laporan Excel atau hitungan profit toko Anda?',
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

  const handleSend = async (text) => {
    if (!text.trim()) return
    setError('')
    addMessage('user', text)
    setInputValue('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(-MAX_MESSAGES),
          userMessage: text,
        }),
      })

      if (!res.ok) {
        throw new Error('Gagal menghubungi asisten AI')
      }

      const data = await res.json()
      addMessage('assistant', data.reply || 'Maaf, saya tidak dapat menjawab saat ini.')
    } catch (err) {
      const fallback =
        'Maaf, asisten AI sedang tidak tersedia saat ini (API key belum dikonfigurasi di server). Anda tetap bisa mencoba fitur audit di website ini, atau kirim laporan kendala melalui tombol di bawah chat.'
      addMessage('assistant', fallback)
      setError(fallback)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (q) => {
    handleSend(q)
  }

  const handleEmailAdmin = () => {
    const subject = encodeURIComponent('Laporan Kendala AuditToko AI')
    const body = encodeURIComponent(
      'Halo Admin AuditToko AI,\n\nSaya mengalami kendala saat menggunakan website AuditToko AI.\n\nDetail kendala:\n- Tanggal: ' +
        new Date().toLocaleString('id-ID') +
        '\n- Deskripsi: (tulis di sini)\n\nMohon segera diperbaiki. Terima kasih.'
    )
    window.location.href = `mailto:bantuan.audittoko@gmail.com?subject=${subject}&body=${body}`
    // Ganti alamat email di atas (bantuan.audittoko@gmail.com) dengan alamat email admin Anda.
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
        <span className="hidden sm:inline">Tanya Asisten AI</span>
      </button>

      {/* Jendela Chat — posisi fixed di pojok kanan bawah, z-[9999] agar selalu paling atas, TANPA overlay blur full-screen */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-[9999] w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col h-[90vh] max-h-[700px]">
                {/* Header Chat */}
                <div className="flex items-center gap-2 px-6 py-4 bg-blue-50 border-b border-blue-100 rounded-t-2xl">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Tanya Asisten AI</h3>
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
                placeholder="Ketik pertanyaan Anda di sini…"
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

            {/* Tombol Kirim Laporan Kendala ke Email Admin */}
            <div className="p-3 border-t border-slate-100 bg-amber-50/50 rounded-b-2xl">
              <button
                onClick={handleEmailAdmin}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-amber-200 rounded-lg text-amber-700 text-sm font-medium hover:bg-amber-50 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Kirim Laporan Kendala ke Email Admin
              </button>
              <p className="text-[10px] text-amber-500 mt-1 px-1 text-center">
                Ganti alamat email admin di kode AiChatWidget.js (baris handleEmailAdmin)
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

