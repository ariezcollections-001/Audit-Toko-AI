import { NextResponse } from 'next/server'
import { adminStore } from '../../lib/adminStore'
import { limiters } from '../../lib/rateLimit'

const BASE_SYSTEM_INSTRUCTION = `
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
    // Rate limit: maksimal 15 permintaan per menit per IP
    const limit = limiters.aiChat(req)
    if (!limit.allowed) {
      return NextResponse.json(
        { reply: 'Mohon maaf Kak, terlalu banyak permintaan ke asisten AI. Silakan coba lagi nanti ya Kak.' },
        { status: 429 }
      )
    }

    const { messages, userMessage, customKnowledge, reportContext } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY

    // Ambil custom knowledge dari konfigurasi admin jika ada
    let adminKnowledge = ''
    try {
      const config = await adminStore.getConfig()
      if (config?.aiCustomKnowledge) {
        adminKnowledge = config.aiCustomKnowledge
      }
    } catch {}

    // Gabungkan custom knowledge dari body dan dari admin config
    const combinedKnowledge = [customKnowledge, adminKnowledge].filter(Boolean).join('\n\n')

    // Blok data laporan pelanggan yang sedang aktif di layar (Sheet 1 & Sheet 2 hasil unduhan Excel)
    let reportContextBlock = ''
    if (reportContext) {
      const {
        fileName,
        marketplace,
        totalOrders,
        totalUnitsSold,
        totalGrossSales,
        totalDeductions,
        totalSettlement,
        deductionBreakdown,
        totalShippingDiscrepancy,
        totalReturnLoss,
        returnedOrdersCount,
        totalHpp,
        totalPacking,
        adsCost,
        netProfit,
        netMarginPercent,
        targetProfit,
        topProducts,
      } = reportContext

      const breakdownText =
        Array.isArray(deductionBreakdown) && deductionBreakdown.length > 0
          ? deductionBreakdown
              .map((d) => `- ${d.label}: Rp ${Number(d.amount || 0)}`)
              .join('\n')
          : '-'

      const productsText =
        Array.isArray(topProducts) && topProducts.length > 0
          ? topProducts
              .map(
                (p) =>
                  `- ${p.name}: qty ${p.qty}, harga jual lama Rp ${p.oldPrice}, potongan/pcs Rp ${p.deductionPerUnit}, HPP Rp ${p.hpp}, packing Rp ${p.packing}, harga baru Rp ${p.newPrice}, estimasi profit baru/pcs Rp ${p.newProfitPerUnit}`
              )
              .join('\n')
          : '-'

      reportContextBlock = `

DATA LAPORAN PELANGGAN YANG SEDANG AKTIF DI LAYAR
==================================================
Berikut adalah ringkasan data audit yang sedang dilihat pelanggan di layar web (sumber: Sheet 1 "Rekomendasi_Harga_Baru" dan Sheet 2 "Ringkasan_Audit_Toko" dari file Excel hasil unduhan). Gunakan blok ini untuk menjelaskan asal-usul setiap nominal Rupiah secara akurat dan ramah, selalu sapai dengan "Kak"/"Kakak".

• File: ${fileName} | Marketplace: ${marketplace}
• Total Pesanan: ${totalOrders}
• Total Unit Terjual: ${totalUnitsSold}
• Total Omzet Kotor (Gross Sales): Rp ${totalGrossSales}
• Total Potongan Marketplace: Rp ${totalDeductions}
• Total Dana Bersih Cair (Settlement): Rp ${totalSettlement}
• Rincian Potongan per Kolom Asli Excel:
${breakdownText}
• Selisih Ongkir / Discrepancy Pengiriman: Rp ${totalShippingDiscrepancy}
• Biaya Hangus Akibat Retur / Batal: Rp ${totalReturnLoss}
• Jumlah Pesanan Retur / Batal: ${returnedOrdersCount}
• Total Modal HPP: Rp ${totalHpp}
• Total Biaya Packing: Rp ${totalPacking}
• Biaya Iklan (Ads): Rp ${adsCost}
• Laba Bersih (Net Profit): Rp ${netProfit}
• Margin Bersih (Net Margin): ${netMarginPercent}%
• Target Profit: ${targetProfit}%

• 10 Produk Teratas (dari Sheet 1 Rekomendasi_Harga_Baru):
${productsText}

Cara membaca asal-usul nominal:
- Omzet Kotor = jumlah harga jual per produk dari file Excel pelanggan (belum dipotong).
- Dana Bersih Cair = Omzet Kotor − Total Potongan Marketplace.
- Total Potongan = jumlah semua komponen potongan dari kolom asli Excel (biaya admin, komisi platform, ongkir, retur, dan lain-lain).
- Laba Bersih = Dana Bersih Cair − Modal HPP − Biaya Packing − Biaya Iklan − Biaya Hangus Retur.
- Margin Bersih = Laba Bersih ÷ Dana Bersih Cair × 100.
- Harga baru & profit baru per produk berasal dari Sheet 1 "Rekomendasi_Harga_Baru", dihitung dari HPP, packing, biaya iklan, dan target profit pelanggan.
`
    }

    const SYSTEM_INSTRUCTION = combinedKnowledge
      ? BASE_SYSTEM_INSTRUCTION +
        `\n\nPENGETAHUAN TAMBAHAN DARI ADMIN:\n${combinedKnowledge}\n` +
        reportContextBlock
      : BASE_SYSTEM_INSTRUCTION + reportContextBlock

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