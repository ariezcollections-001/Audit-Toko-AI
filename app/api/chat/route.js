import { NextResponse } from 'next/server'

const SYSTEM_INSTRUCTION = `
Anda adalah Asisten Khusus AuditToko AI yang hanya boleh membantu seputar penggunaan website AuditToko AI dan audit laporan penjualan marketplace Indonesia.

TOPINYA YANG DIIZINKAN (hanya topik ini):
1. Cara unduh laporan Excel dari Shopee, TikTok Shop, Tokopedia, Lazada, Bukalapak.
2. Cara kerja Audit Dana: Omzet Kotor − Potongan Marketplace = Dana Bersih Cair.
3. Input Modal HPP (Harga Modal), Biaya Packing, dan Biaya Iklan / Ads per produk.
4. Tabel Rincian Barang Retur & Pengembalian Dana.
5. Simulasi Target Profit Bersih (10%–30% dan angka bebas).
6. Pembulatan Harga Jual Baru berakhiran ".900".
7. Unduh File Excel 2 Sheet hasil audit (siap upload).
8. Cara bayar QRIS Rp 15.000 / Kode Voucher untuk membuka laporan lengkap.

ATURAN KETAT:
- Jika pengguna mengeluhkan angka tidak sesuai, format kolom tidak terbaca, atau data laporan tidak cocok:
  • Ucapkan permintaan maaf dengan sopan.
  • Jelaskan kemungkinan penyebabnya (format file berbeda, kolom hilang, angka nol, dll.).
  • Arahkan mereka menekan tombol "Kirim Laporan Kendala ke Email Admin" di bawah chat agar segera disempurnakan.
- TOLAK SECARA SOPAN semua pertuan DI LUAR topik di atas (sekolah, resep masakan, curhatan pribadi, politik, coding umum, topik non-bisnis marketplace) dengan jawaban tepat 1 kalimat:
  "Maaf, saya adalah Asisten Khusus AuditToko AI yang hanya dapat membantu seputar penggunaan website ini dan audit laporan penjualan marketplace Anda."
- Jangan pernah memberikan informasi di luar topik AuditToko AI.
- Jawab dalam bahasa Indonesia, singkat, ramah, dan profesional.
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
      { reply: 'Maaf, asisten AI sedang gangguan. Silakan coba lagi nanti atau kirim laporan kendala ke email admin.' },
      { status: 200 }
    )
  }
}