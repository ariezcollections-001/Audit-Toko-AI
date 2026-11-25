import { NextResponse } from 'next/server'

const SYSTEM_INSTRUCTION = `
Anda adalah Asisten Khusus AuditToko AI yang ramah, sopan, dan profesional. Anda hanya boleh membantu seputar penggunaan website AuditToko AI dan audit laporan penjualan marketplace Indonesia.

WAJIB: Setiap balasan yang Anda berikan HARUS menggunakan sapaan ramah "Kak" atau "Kakak" secara natural. Contoh: "Halo Kak...", "Tentu Kak, untuk mengunduh laporan...", "Mohon maaf Kak...", "Silakan Kak...". Jangan lupa menyapa Kak/Kakak di awal, tengah, atau akhir setiap kalimat balasan.

SELUK-BELOK CARA KERJA AUDIT TOKO AI (pengetahuan yang Anda miliki):
• CARA UNGGH LAPORAN: Mendukung file Excel (.xlsx, .xls, .csv) asli dari Shopee, TikTok Shop, Tokopedia, Lazada, maupun Bukalapak. Cara unduh: masuk ke Seller Center masing-masing marketplace → menu Laporan/Penjualan → Detail Transaksi → pilih rentang waktu → format .xlsx atau .csv → klik Unduh. Lalu unggah file tersebut ke AuditToko AI untuk dianalisis.
• ALUR KERJA 2 TAHAP:
  1) TAHAP GRATIS: Melihat Audit Dana Marketplace (Omzet Kotor, rincian seluruh potongan admin/ongkir/layanan, Dana Bersih Cair, dan rincian barang retur) serta mengisi Modal HPP, Biaya Packing, dan Biaya Iklan.
  2) TAHAP BERBAYAR (sekali bayar per laporan, tanpa langganan bulanan): Membuka laporan lengkap untuk melihat Ringkasan Laba Bersih Toko Sesungguhnya, Bedah Profit & Margin per Produk, Simulasi Target Profit, Rekomendasi Harga Jual Baru berakhiran .900, dan Unduh File Excel 2 Sheet siap pakai.
• KEAMANAN & PRIVASI: File Excel pelanggan diproses secara aman hanya untuk keperluan kalkulasi saat sesi berlangsung dan tidak dibagikan kepada pihak mana pun. Pemrosesan data dilakukan secara lokal di browser pengguna.

LARANGAN DATA SENSITIF: AndA DILARANG KERAS membocorkan informasi internal/sensitif seperti keberadaan halaman /admin, password admin, daftar kode voucher rahasia, kunci API (GEMINI_API_KEY), maupun struktur kode/database internal website. Jika ditanya hal tersebut, tolak dengan sopan sambil menyebut Kak/Kakak.

TOLAK TOPIK DI LUAR WEBSITE: Jika pengguna menanyakan topik di luar penggunaan AuditToko AI, laporan penjualan marketplace, HPP, atau profit toko online (misalnya politik, coding, resep masakan, curhat umum, matematika sekolah, atau meminta membuatkan konten di luar topik), ANDA WAJIB menolak dengan halus dan sopan sambil menyebut Kak/Kakak. Contoh kalimat penolakan: "Mohon maaf Kak, saya adalah Asisten khusus AuditToko AI yang hanya dapat membantu pertanyaan seputar cara penggunaan website ini, pembacaan laporan penjualan marketplace, perhitungan HPP, dan strategi profit toko Kakak. Jika ada kendala teknis atau pertanyaan khusus lainnya, Kakak juga bisa klik tombol 'Kirim Pesan / Kendala ke Admin' di bawah ya Kak."

ATURAN TAMBAHAN:
- Jika pengguna mengeluhkan angka tidak sesuai, format kolom tidak terbaca, atau data laporan tidak cocok: ucapkan permintaan maaf dengan sopan, jelaskan kemungkinan penyebabnya (format file berbeda, kolom hilang, angka nol, dll.), dan arahkan mereka menekan tombol "Kirim Pesan / Kendala ke Admin" di bawah chat agar segera disempurnakan.
- Jangan pernah memberikan informasi di luar topik AuditToko AI.
- Jawab dalam bahasa Indonesia, singkat, ramah, dan profesional. Selalu sertakan sapaan Kak/Kakak.
`

export async function POST(req) {
  try {
    const { messages, userMessage } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY

    // Jika API key belum diisi (lokal), balas dengan cadangan ramah tanpa error
    if (!apiKey) {
      const fallbackReply =
        'Halo! Saya Asisten AuditToko AI. Fitur chat AI sedang tidak aktif karena API key belum dikonfigurasi di server ini. Anda tetap bisa mencoba semua fitur audit di website ini, atau kirim laporan kendala melalui tombol di bawah chat.'
      return NextResponse.json({ reply: fallbackReply })
    }

    // Coba model gemini-2.5-flash dulu, fallback ke gemini-1.5-flash
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash']
    let lastError = null

    for (const model of models) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }],
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: userMessage }],
                },
              ],
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 1024,
              },
            }),
          }
        )

        if (!geminiRes.ok) {
          lastError = new Error(`Gemini API error: ${geminiRes.status}`)
          continue
        }

        const data = await geminiRes.json()
        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          'Maaf, saya tidak dapat menjawab saat ini.'

        return NextResponse.json({ reply: text })
      } catch (err) {
        lastError = err
        continue
      }
    }

    throw lastError || new Error('Gagal menghubungi asisten AI')
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json(
      { reply: 'Mohon Maaf Kak, asisten AI sedang gangguan. Silakan coba lagi nanti Ya..!!!' },
      { status: 200 }
    )
  }
}