import { NextResponse } from 'next/server'
import { adminStore } from '../../lib/adminStore'
import { limiters } from '../../lib/rateLimit'

/* ============================================================================
   HELPER: ambil IP klien dari request
   ============================================================================ */
function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown'
}

/* ============================================================================
   GET /api/admin — konfigurasi publik & data admin
   ============================================================================ */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'config'
    const isPublic = searchParams.get('public') === '1'

    // Daftar kolom yang BOLEH dikirim ke publik (public=1)
    const PUBLIC_CONFIG_FIELDS = [
      'brandName', 'brandLogoUrl', 'auditPrice', 'maintenanceMode',
      'bannerEnabled', 'bannerType', 'bannerText', 'bannerColor',
      'bannerTextMotion', 'bannerEffect', 'bannerImageUrl', 'bannerLink',
      'aiChatEnabled',
    ]

    if (action === 'config') {
      const config = await adminStore.getConfig()
      // Publik: HANYA field yang aman, DILARANG KERAS menyertakan adminPassword
      const publicConfig = {}
      for (const f of PUBLIC_CONFIG_FIELDS) {
        if (config[f] !== undefined) publicConfig[f] = config[f]
      }
      return NextResponse.json(isPublic ? publicConfig : config)
    }
    if (action === 'vouchers') return NextResponse.json(await adminStore.getVouchers())
    if (action === 'analytics') return NextResponse.json(await adminStore.getAnalytics())
    if (action === 'transactions') return NextResponse.json(await adminStore.getTransactions())
    if (action === 'supportTickets') return NextResponse.json(await adminStore.getSupportTickets())
    if (action === 'unrecognizedColumns') return NextResponse.json(await adminStore.getUnrecognizedColumns())
    if (action === 'full') {
      const store = await adminStore.getFullStore()
      // Publik: hapus semua data sensitif dari config, transaksi, dan tiket dukungan
      const safeStore = { ...store }
      const safeConfig = {}
      for (const f of PUBLIC_CONFIG_FIELDS) {
        if (store.config[f] !== undefined) safeConfig[f] = store.config[f]
      }
      safeStore.config = safeConfig
      // Hapus daftar transaksi dan tiket dukungan dari respons publik
      safeStore.transactions = []
      safeStore.supportTickets = []
      safeStore.unrecognizedColumns = []
      return NextResponse.json(isPublic ? safeStore : { ...store, config: safeConfig })
    }
    return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 })
  } catch (err) {
    console.error('Admin GET error:', err)
    return NextResponse.json({ error: 'Gagal membaca data admin' }, { status: 500 })
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api.admin — aksi admin (login, update config, catat event)  */
/* ------------------------------------------------------------------ */
export async function POST(req) {
  try {
    const body = await req.json()
    const { action } = body

    /* ---------- LOGIN ---------- */
    if (action === 'login') {
      // Rate limit: maksimal 5 gagal per 15 menit per IP
      const limit = limiters.adminLogin(req)
      if (!limit.allowed) {
        return NextResponse.json(
          { error: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' },
          { status: 429 }
        )
      }
      const { password } = body
      const config = await adminStore.getConfig()
      if (password === config.adminPassword) {
        return NextResponse.json({ success: true })
      }
      return NextResponse.json({ error: 'Password salah' }, { status: 401 })
    }

    /* ---------- UPDATE CONFIG ---------- */
    if (action === 'update_config') {
      const { password, ...updates } = body
      const config = await adminStore.getConfig()
      if (password !== config.adminPassword) {
        return NextResponse.json({ error: 'Password admin diperlukan' }, { status: 401 })
      }
      // Validasi bannerLink: hanya terima URL http:// atau https://
      if (updates.bannerLink !== undefined && updates.bannerLink !== '') {
        if (!/^https?:\/\//i.test(String(updates.bannerLink))) {
          return NextResponse.json(
            { error: 'bannerLink harus diawali dengan http:// atau https://' },
            { status: 400 }
          )
        }
      }
      const updated = await adminStore.updateConfig(updates)
      return NextResponse.json({ success: true, config: updated })
    }

    /* ---------- UPDATE PASSWORD ---------- */
    if (action === 'update_password') {
      const { password, newPassword } = body
      const config = await adminStore.getConfig()
      if (password !== config.adminPassword) {
        return NextResponse.json({ error: 'Password admin diperlukan' }, { status: 401 })
      }
      const updated = await adminStore.updateConfig({ adminPassword: newPassword })
      return NextResponse.json({ success: true, config: updated })
    }

    /* ---------- RECORD ANALYTICS EVENT ---------- */
    if (action === 'recordEvent') {
      const { type, payload } = body
      if (!type || !['visits', 'uploads', 'unlocks'].includes(type)) {
        return NextResponse.json({ error: 'Tipe event tidak valid' }, { status: 400 })
      }
      const entry = await adminStore.recordEvent(type, payload || {})
      return NextResponse.json({ success: true, entry })
    }

    /* ---------- VOUCHER: consume one-time code (redeem) ---------- */
    if (action === 'consumeVoucher' || action === 'redeem_voucher') {
      // Rate limit: maksimal 10 percobaan per menit per IP
      const limit = limiters.voucherRedeem(req)
      if (!limit.allowed) {
        return NextResponse.json(
          { error: 'Terlalu banyak percobaan redeem voucher. Silakan coba lagi nanti.' },
          { status: 429 }
        )
      }
      const { code } = body
      const consumed = await adminStore.consumeOneTimeCode(code)
      if (consumed) {
        return NextResponse.json({ success: true, consumed: true })
      }
      return NextResponse.json({ success: false, consumed: false, error: 'Kode tidak valid atau sudah habis' })
    }

    /* ---------- VOUCHER: add one-time code ---------- */
    if (action === 'add_vouchers') {
      const { password, code } = body
      const config = await adminStore.getConfig()
      if (password !== config.adminPassword) {
        return NextResponse.json({ error: 'Password admin diperlukan' }, { status: 401 })
      }
      const vouchers = await adminStore.addOneTimeCode(code)
      return NextResponse.json({ success: true, vouchers })
    }

    /* ---------- VOUCHER: delete one-time code ---------- */
    if (action === 'delete_voucher') {
      const { password, code } = body
      const config = await adminStore.getConfig()
      if (password !== config.adminPassword) {
        return NextResponse.json({ error: 'Password admin diperlukan' }, { status: 401 })
      }
      const vouchers = await adminStore.removeOneTimeCode(code)
      return NextResponse.json({ success: true, vouchers })
    }

    /* ---------- VOUCHER: update master code ---------- */
    if (action === 'update_master') {
      const { password, masterCode } = body
      const config = await adminStore.getConfig()
      if (password !== config.adminPassword) {
        return NextResponse.json({ error: 'Password admin diperlukan' }, { status: 401 })
      }
      const vouchers = await adminStore.updateVouchers({ masterCode })
      return NextResponse.json({ success: true, vouchers })
    }

    /* ---------- ADD TRANSACTION ---------- */
    if (action === 'addTransaction') {
      const tx = await adminStore.addTransaction(body)
      return NextResponse.json({ success: true, transaction: tx })
    }

    /* ---------- ADD SUPPORT TICKET ---------- */
    if (action === 'addSupportTicket') {
      const ticket = await adminStore.addSupportTicket(body)
      return NextResponse.json({ success: true, ticket })
    }

    /* ---------- UPDATE SUPPORT TICKET ---------- */
    if (action === 'update_ticket') {
      const { id, ...updates } = body
      await adminStore.updateSupportTicket(id, updates)
      return NextResponse.json({ success: true })
    }

    /* ---------- DELETE SUPPORT TICKET ---------- */
    if (action === 'delete_ticket') {
      const { id } = body
      await adminStore.deleteSupportTicket(id)
      return NextResponse.json({ success: true })
    }

    /* ---------- ADD UNRECOGNIZED COLUMN ---------- */
    if (action === 'addUnrecognizedColumn') {
      const { headers } = body
      const result = await adminStore.addUnrecognizedColumn(headers)
      return NextResponse.json({ success: true, result })
    }

    /* ---------- RESET DEMO DATA ---------- */
    if (action === 'reset_demo') {
      const { password } = body
      const config = await adminStore.getConfig()
      if (password !== config.adminPassword) {
        return NextResponse.json({ error: 'Password admin diperlukan' }, { status: 401 })
      }
      await adminStore.resetStore()
      return NextResponse.json({ success: true, message: 'Data reset berhasil' })
    }

    /* ---------- RESET ANALYTICS (STATISTIK PENGUNJUNG) ---------- */
    if (action === 'reset_analytics') {
      const { password } = body
      const config = await adminStore.getConfig()
      if (password !== config.adminPassword) {
        return NextResponse.json({ error: 'Password admin diperlukan' }, { status: 401 })
      }
      await adminStore.resetAnalytics()
      return NextResponse.json({ success: true, message: 'Statistik pengunjung berhasil direset' })
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali' }, { status: 400 })
  } catch (err) {
    console.error('Admin POST error:', err)
    return NextResponse.json({ error: 'Gagal memproses permintaan admin' }, { status: 500 })
  }
}