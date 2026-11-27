'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LayoutDashboard, FileText, Mail, CreditCard, Layout, Palette, Shield,
  LogIn, Lock, LogOut, BarChart3, DollarSign, RefreshCw, Eye, EyeOff,
} from 'lucide-react'

/* =====================================================================
   Toast notification
   ===================================================================== */
let toastListeners = []
export const useToast = () => {
  const [toast, setToast] = useState(null)
  useEffect(() => {
    const listener = (msg, type) => {
      setToast({ msg, type })
      setTimeout(() => setToast(null), 3000)
    }
    toastListeners.push(listener)
    return () => { toastListeners = toastListeners.filter((l) => l !== listener) }
  }, [])
  const show = (msg, type = 'success') => {
    toastListeners.forEach((fn) => fn(msg, type))
  }
  return { toast, show }
}

/* =====================================================================
   Helper: panggil API admin dengan action standar
   ===================================================================== */
const adminApi = async (action, body = {}, opts = {}) => {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
    ...opts,
  })
  return res
}

/* =====================================================================
   Tab komponen — didefinisikan LUAR AdminPage agar state input lokal
   tidak dire-create setiap kali AdminPage me-render (fix kehilangan fokus)
   ===================================================================== */

export const TabStats = ({ analytics, analyticsPeriod, setAnalytics, fetchData }) => {
  const [localPeriod, setLocalPeriod] = useState(analyticsPeriod)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const stats = (() => {
    const now = new Date()
    const vs = analytics.visits || [], us = analytics.uploads || [], ns = analytics.unlocks || []
    const filter = (arr) => arr.filter((i) => { const d = new Date(i.date)
      if (localPeriod === 'harian') return d.toDateString() === now.toDateString()
      if (localPeriod === 'mingguan') { const ws = new Date(now); ws.setDate(now.getDate() - now.getDay()); ws.setHours(0,0,0,0); const we = new Date(ws); we.setDate(we.getDate()+6); return d >= ws && d <= we }
      if (localPeriod === 'bulanan') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      if (localPeriod === 'tahunan') return d.getFullYear() === now.getFullYear()
      return true })
    const v = filter(vs).length, u = filter(us).length, un = filter(ns).length
    const conv = v > 0 ? ((un / v) * 100).toFixed(1) : 0
    return { visits: v, uploads: u, unlocks: un, conversion: parseFloat(conv) }
  })()

  const handleResetStats = async () => {
    setShowResetConfirm(false)
    setAnalytics({ visits: [], uploads: [], unlocks: [] })
    await fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4">
        {['harian', 'mingguan', 'bulanan', 'tahunan'].map((p) => (
          <button key={p} onClick={() => setLocalPeriod(p)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${localPeriod === p ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <button onClick={() => setShowResetConfirm(true)} className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors">
          Reset Statistik
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm"><div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Pengunjung</div><div className="text-3xl font-bold text-blue-600">{stats.visits}</div></div>
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm"><div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Upload</div><div className="text-3xl font-bold text-emerald-600">{stats.uploads}</div></div>
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm"><div className="text-slate-500 text-xs font-semibold uppercase mb-1">Laporan Terbuka</div><div className="text-3xl font-bold text-amber-600">{stats.unlocks}</div></div>
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm"><div className="text-slate-500 text-xs font-semibold uppercase mb-1">Tingkat Konversi</div><div className="text-3xl font-bold text-purple-600">{stats.conversion}%</div></div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Grafik Aktivitas</h3>
        <div className="h-64 flex items-center end gap-1">
          {[7, 5, 9, 4, 12, 8, 15].map((val, i) => (
            <div key={i} className="flex flex-col items-center gap-1 w-full" style={{ flex: 1 }}>
              <div className="w-full bg-blue-600 rounded-t-sm" style={{ height: `${(val / 15) * 100}%` }} />
              <span className="text-xs text-slate-500">{val}</span>
            </div>
          ))}
        </div>
      </div>
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Reset Statistik</h3>
            <p className="text-sm text-slate-600 mb-6">
              Yakin ingin mereset seluruh statistik pengunjung, upload, laporan terbuka, dan tingkat konversi ke 0? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                Batal
              </button>
              <button onClick={handleResetStats} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const TabTransactions = ({ transactions, onResetDemo }) => {
  const [showResetModal, setShowResetModal] = useState(false)

  const handleDownloadExcel = () => {
    const headers = ['TANGGAL', 'METODE', 'KODE VOUCHER', 'FILE', 'JUMLAH']
    const rows = [...transactions].reverse().map((tx) => [
      tx.date || '',
      tx.method || '',
      tx.codeUsed || '-',
      tx.fileName || '-',
      `Rp ${(tx.amount || 0).toLocaleString('id-ID')}`
    ])
    const total = transactions.reduce((s, t) => s + (t.amount || 0), 0)
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      ['TOTAL PEMASUKAN BERSIH', '', '', '', `Rp ${total.toLocaleString('id-ID')}`].join(',')
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-keuangan-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleResetConfirm = async () => {
    setShowResetModal(false)
    await onResetDemo()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6"><div className="text-emerald-500 text-xs font-semibold uppercase mb-1">Total Pemasukan Bersih</div><div className="text-2xl font-bold text-emerald-700">Rp {transactions.reduce((s, t) => s + (t.amount || 0), 0).toLocaleString('id-ID')}</div></div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6"><div className="text-blue-500 text-xs font-semibold uppercase mb-1">Total Transaksi</div><div className="text-2xl font-bold text-blue-700">{transactions.length}</div></div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6"><div className="text-amber-500 text-xs font-semibold uppercase mb-1">Metode QRIS</div><div className="text-2xl font-bold text-amber-700">{transactions.filter((t) => t.method === 'QRIS').length}</div></div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tanggal</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Metode</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Kode Voucher</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">File</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Jumlah</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {[...transactions].reverse().map((tx) => (
              <tr key={tx.id}>
                <td className="px-4 py-3 text-slate-700">{tx.date}</td>
                <td className="px-4 py-3 text-slate-700"><span className={`px-2 py-1 rounded text-xs font-medium ${tx.method === 'QRIS' ? 'bg-blue-100 text-blue-700' : tx.method === 'MASTER_VOUCHER' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tx.method}</span></td>
                <td className="px-4 py-3 text-slate-700">{tx.codeUsed || '-'}</td>
                <td className="px-4 py-3 text-slate-700 truncate max-w-xs">{tx.fileName || '-'}</td>
                <td className="px-4 py-3 text-right text-slate-700 font-semibold">Rp {(tx.amount || 0).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 my-4">
        <button onClick={handleDownloadExcel} className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          Unduh Laporan Keuangan (.xlsx)
        </button>
        <button onClick={() => setShowResetModal(true)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
          Reset Data Uji Coba
        </button>
      </div>
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Reset Data</h3>
            <p className="text-sm text-slate-600 mb-6">
              Yakin ingin me-reset seluruh data uji coba? Semua grafik pengunjung dan riwayat transaksi akan dihapus permanen ke 0.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowResetModal(false)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                Batal
              </button>
              <button onClick={handleResetConfirm} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const TabInbox = ({ supportTickets, fetchData, showToast }) => {
  const markTicket = async (id, status) => {
    try {
      await adminApi('update_ticket', { id, status: status === 'unread' ? 'read' : 'unread' })
      await fetchData()
      showToast('Status tiket diperbarui.', 'success')
    } catch { showToast('Gagal memperbarui status tiket.', 'error') }
  }
  const deleteTicket = async (id) => {
    if (!confirm('Hapus tiket ini?')) return
    try {
      await adminApi('delete_ticket', { id })
      await fetchData()
      showToast('Tiket dihapus.', 'success')
    } catch { showToast('Gagal menghapus tiket.', 'error') }
  }
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tanggal</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Pengirim</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Pesan</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Aksi</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {[...supportTickets].reverse().map((ticket) => (
              <tr key={ticket.id}>
                <td className="px-4 py-3 text-slate-700">{new Date(ticket.createdAt).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3 text-slate-700 font-medium">{ticket.contact || 'Anonim'}</td>
                <td className="px-4 py-3 text-slate-600 truncate max-w-xs">{ticket.message}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${ticket.status === 'unread' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>{ticket.status === 'unread' ? 'Belum Dibaca' : 'Selesai'}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => markTicket(ticket.id, ticket.status)} className="text-xs px-3 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">{ticket.status === 'unread' ? 'Tandai Selesai' : 'Tandai Belum Dibaca'}</button>
                  <button onClick={() => deleteTicket(ticket.id)} className="text-xs px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">Hapus</button>
                </td>
              </tr>
            ))}
            {supportTickets.length === 0 && (<tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Belum ada pesan masuk.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const TabVouchers = ({ vouchers, setVouchers, adminPassword, showToast }) => {
  const [localMasterCode, setLocalMasterCode] = useState('')
  const [localNewVoucher, setLocalNewVoucher] = useState('')

  const handleUpdateMasterCode = async (e) => {
    e.preventDefault()
    if (!localMasterCode.trim()) return
    if (!adminPassword) { showToast('Masukkan password admin terlebih dahulu.', 'error'); return }
    try {
      const res = await adminApi('update_master', { masterCode: localMasterCode.trim(), password: adminPassword })
      if (res.ok) {
        const d = await res.json()
        setVouchers(d.vouchers)
        setLocalMasterCode('')
        showToast('Kode Master diperbarui.', 'success')
      } else { showToast('Gagal memperbarui Kode Master.', 'error') }
    } catch { showToast('Gagal server.', 'error') }
  }

  const handleAddVoucher = async (e) => {
    e.preventDefault()
    if (!localNewVoucher.trim()) return
    if (!adminPassword) { showToast('Masukkan password admin terlebih dahulu.', 'error'); return }
    try {
      const res = await adminApi('add_vouchers', { code: localNewVoucher.trim(), password: adminPassword })
      if (res.ok) {
        const d = await res.json()
        setVouchers(d.vouchers)
        setLocalNewVoucher('')
        showToast('Voucher ditambahkan.', 'success')
      } else { showToast('Gagal menambahkan voucher.', 'error') }
    } catch { showToast('Gagal server.', 'error') }
  }

  const handleRemoveVoucher = async (code) => {
    if (!adminPassword) { showToast('Masukkan password admin terlebih dahulu.', 'error'); return }
    try {
      const res = await adminApi('delete_voucher', { code, password: adminPassword })
      if (res.ok) {
        const d = await res.json()
        setVouchers(d.vouchers)
        showToast('Voucher dihapus.', 'success')
      } else { showToast('Gagal menghapus voucher.', 'error') }
    } catch { showToast('Gagal server.', 'error') }
  }

  const handleGenerateRandomCodes = async () => {
    if (!adminPassword) { showToast('Masukkan password admin terlebih dahulu.', 'error'); return }
    const codes = []
    for (let i = 0; i < 5; i++) codes.push('AUDIT-' + Math.random().toString(36).substring(2, 10).toUpperCase())
    try {
      for (const code of codes) {
        await adminApi('add_vouchers', { code, password: adminPassword })
      }
      const res = await fetch('/api/admin?action=vouchers', { cache: 'no-store' })
      const d = await res.json()
      setVouchers(d)
      showToast('5 kode voucher berhasil dibuat!', 'success')
    } catch { showToast('Gagal generate.', 'error') }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Kode Master Pemilik</h3>
          <p className="text-sm text-slate-500 mb-4">Kode master dapat digunakan unlimited kali untuk membuka laporan audit.</p>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-mono font-medium">{vouchers.masterCode}</span>
            <button onClick={() => navigator.clipboard.writeText(vouchers.masterCode)} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Salin Kode Master">Salin</button>
          </div>
          <form onSubmit={handleUpdateMasterCode} className="space-y-3">
            <input type="text" value={localMasterCode} onChange={(e) => setLocalMasterCode(e.target.value)} placeholder="Masukkan kode master baru" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">Simpan Kode Master</button>
          </form>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Voucher 1x Pakai</h3>
          <p className="text-sm text-slate-500 mb-4">Voucher 1x pakai akan otomatis hangus dan terhapus setelah digunakan pelanggan.</p>
          <form onSubmit={handleAddVoucher} className="space-y-3 mb-4">
            <div className="flex gap-2">
              <input type="text" value={localNewVoucher} onChange={(e) => setLocalNewVoucher(e.target.value)} placeholder="Kode voucher baru" className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
              <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors">Tambah</button>
            </div>
          </form>
          <div className="flex gap-2">
            <button onClick={handleGenerateRandomCodes} className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors">Generate 5 Kode Acak</button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Kode</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tipe</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Aksi</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-4 py-3 text-slate-700 font-mono text-sm">{vouchers.masterCode}</td>
              <td className="px-4 py-3 text-slate-700"><span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">Master (Unlimited)</span></td>
              <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                <button onClick={() => navigator.clipboard.writeText(vouchers.masterCode)} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Salin Kode Master">Salin</button>
              </td>
            </tr>
            {vouchers.oneTimeCodes.map((code) => (
              <tr key={code}>
                <td className="px-4 py-3 text-slate-700 font-mono text-sm">{code}</td>
                <td className="px-4 py-3 text-slate-700"><span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-medium">1x Pakai</span></td>
                <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                  <button onClick={() => navigator.clipboard.writeText(code)} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Salin Kode">Salin</button>
                  <button onClick={() => handleRemoveVoucher(code)} className="text-xs px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">Hapus</button>
                </td>
              </tr>
            ))}
            {vouchers.oneTimeCodes.length === 0 && (<tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">Belum ada voucher 1x pakai.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const TabUnrecognized = ({ unrecognizedColumns }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50"><tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ID</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tanggal</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Header Kolom</th>
        </tr></thead>
        <tbody className="divide-y divide-slate-100">
          {[...unrecognizedColumns].reverse().map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 text-slate-700 font-mono text-xs">{item.id}</td>
              <td className="px-4 py-3 text-slate-700">{item.date}</td>
              <td className="px-4 py-3 text-slate-600 text-sm">{item.headers.map((h, i) => (<span key={i} className="inline-block px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs mr-1 mb-1">{h}</span>))}</td>
            </tr>
          ))}
          {unrecognizedColumns.length === 0 && (<tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">Belum ada catatan kolom asing.</td></tr>)}
        </tbody>
      </table>
    </div>
    <p className="text-sm text-slate-500">Data ini mencatat nama header kolom yang terekam saat pelanggan mengalami Fallback Manual Mapping. Tidak menyimpan data penjualan atau privasi pelanggan.</p>
  </div>
)

export const TabControls = ({ config, setConfig, adminPassword, showToast, fetchData }) => {
  const [localBrandName, setLocalBrandName] = useState(config.brandName || 'AuditToko AI')
  const [localBannerText, setLocalBannerText] = useState(config.bannerText || '')
  const [localBannerLink, setLocalBannerLink] = useState(config.bannerLink || '')
  const [localAiCustomKnowledge, setLocalAiCustomKnowledge] = useState(config.aiCustomKnowledge || '')
  const [logoPreview, setLogoPreview] = useState(config.brandLogoUrl || '')
  const [bannerEnabled, setBannerEnabled] = useState(config.bannerEnabled !== false)
  const [bannerType, setBannerType] = useState(config.bannerType || 'text')
  const [bannerColor, setBannerColor] = useState(config.bannerColor || 'blue')
  const [bannerImagePreview, setBannerImagePreview] = useState(config.bannerImageUrl || '')
  const [aiChatEnabled, setAiChatEnabled] = useState(config.aiChatEnabled !== false)
  const [localAuditPrice, setLocalAuditPrice] = useState(String(config.auditPrice || 15000))

  const logoInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]; if (!file) return
    if (!['image/png','image/jpeg','image/svg+xml','image/webp'].includes(file.type)) { alert('Format tidak didukung'); return }
    const r = new FileReader(); r.onload = (ev) => setLogoPreview(ev.target.result); r.readAsDataURL(file)
  }

  const handleResetLogo = async () => {
    if (!adminPassword) { showToast('Masukkan password admin terlebih dahulu.', 'error'); return }
    setLogoPreview('')
    try {
      const res = await adminApi('update_config', { brandLogoUrl: '', password: adminPassword })
      if (res.ok) { const d = await res.json(); setConfig(d.config); showToast('Logo dikembalikan default.', 'success'); await fetchData() }
      else { showToast('Gagal mengembalikan logo.', 'error') }
    } catch { showToast('Gagal server.', 'error') }
  }

  const handleSaveBrand = async () => {
    if (!adminPassword) { showToast('Masukkan password admin terlebih dahulu.', 'error'); return }
    try {
      const res = await adminApi('update_config', { brandName: localBrandName.trim(), brandLogoUrl: logoPreview, password: adminPassword })
      if (res.ok) { const d = await res.json(); setConfig(d.config); showToast('Brand & Logo tersimpan.', 'success'); await fetchData() }
      else { showToast('Gagal menyimpan Brand & Logo.', 'error') }
    } catch { showToast('Gagal server.', 'error') }
  }

  const handleSaveBanner = async () => {
    if (!adminPassword) { showToast('Masukkan password admin terlebih dahulu.', 'error'); return }
    try {
      const res = await adminApi('update_config', { bannerEnabled, bannerType, bannerText: localBannerText.trim(), bannerColor, bannerImageUrl: bannerImagePreview, bannerLink: localBannerLink.trim(), password: adminPassword })
      if (res.ok) { const d = await res.json(); setConfig(d.config); showToast('Pengaturan banner berhasil disimpan!', 'success'); await fetchData() }
      else { showToast('Gagal menyimpan Banner.', 'error') }
    } catch { showToast('Gagal server.', 'error') }
  }

  const handleSaveAI = async () => {
    if (!adminPassword) { showToast('Masukkan password admin terlebih dahulu.', 'error'); return }
    try {
      const res = await adminApi('update_config', { aiChatEnabled, aiCustomKnowledge: localAiCustomKnowledge.trim(), password: adminPassword })
      if (res.ok) { const d = await res.json(); setConfig(d.config); showToast('Pengaturan AI tersimpan.', 'success'); await fetchData() }
      else { showToast('Gagal menyimpan Pengaturan AI.', 'error') }
    } catch { showToast('Gagal server.', 'error') }
  }

  const handleBannerImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return
    if (!file.type.startsWith('image/')) { alert('Harus gambar'); return }
    const r = new FileReader(); r.onload = (ev) => setBannerImagePreview(ev.target.result); r.readAsDataURL(file)
  }

  const handleToggleMaintenance = async () => {
    if (!adminPassword) { showToast('Masukkan password admin terlebih dahulu.', 'error'); return }
    try {
      const res = await adminApi('update_config', { maintenanceMode: !config.maintenanceMode, password: adminPassword })
      if (res.ok) { const d = await res.json(); setConfig(d.config); await fetchData() }
      else { showToast('Gagal mengubah Mode Maintenance.', 'error') }
    } catch { showToast('Gagal server.', 'error') }
  }

  const handleSaveTarif = async () => {
    const val = parseInt(localAuditPrice) || 15000
    if (!adminPassword) { showToast('Masukkan password admin terlebih dahulu.', 'error'); return }
    try {
      const res = await adminApi('update_config', { auditPrice: val, password: adminPassword })
      if (res.ok) { const d = await res.json(); setConfig(d.config); setLocalAuditPrice(String(d.config.auditPrice || val)); showToast('Tarif Audit tersimpan.', 'success'); await fetchData() }
      else { showToast('Gagal menyimpan Tarif.', 'error') }
    } catch { showToast('Gagal server.', 'error') }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Ganti Logo Website</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
            {logoPreview ? (<img src={logoPreview} alt="preview" className="w-full h-full object-cover" />) : (<span className="text-slate-400 text-xl">$</span>)}
          </div>
          <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" onChange={handleLogoUpload} className="hidden" />
          <button onClick={() => logoInputRef.current?.click()} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors">Pilih Gambar</button>
          <button onClick={handleResetLogo} className="px-4 py-2 text-xs text-red-600 hover:bg-red-50 rounded">Kembalikan Default</button>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700">Nama Brand</label>
          <input type="text" value={localBrandName} onChange={(e) => setLocalBrandName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <button onClick={handleSaveBrand} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">Simpan Brand & Logo</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Tarif Harga Audit</h3>
        <p className="text-sm text-slate-500 mb-4">Tarif ini langsung tercermin di halaman depan dan gerbang pembayaran.</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">Rp</span>
          <input type="number" value={localAuditPrice} onChange={(e) => setLocalAuditPrice(e.target.value)} className="text-2xl font-bold text-blue-600 w-32 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
          <span className="text-sm text-slate-500">per laporan</span>
        </div>
        <button onClick={handleSaveTarif} className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">Simpan Tarif</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Banner Pengumuman Atas</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={bannerEnabled} onChange={(e) => setBannerEnabled(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" /> Aktifkan Banner
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Tipe Banner</label>
              <div className="flex gap-2">
                <button onClick={() => setBannerType('text')} className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${bannerType === 'text' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Pita Teks</button>
                <button onClick={() => setBannerType('image')} className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${bannerType === 'image' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Poster Gambar</button>
              </div>
            </div>
          </div>
          {bannerType === 'text' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Teks Promo</label>
              <input type="text" value={localBannerText} onChange={(e) => setLocalBannerText(e.target.value)} placeholder="Contoh: Diskon 20% untuk audit minggu ini!" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
              <label className="text-sm font-medium text-slate-700">Warna Pita</label>
              <div className="flex gap-2">
                {['blue', 'emerald', 'amber', 'red'].map((color) => (
                  <button key={color} onClick={() => setBannerColor(color)} className={`w-10 h-10 rounded-full border-2 transition-all ${bannerColor === color ? 'ring-2 ring-slate-300 scale-110' : 'border-transparent'} ${color === 'blue' ? 'bg-blue-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} />
                ))}
              </div>
            </div>
          )}
          {bannerType === 'image' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Unggah Gambar / URL</label>
              <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerImageUpload} className="hidden" />
              <button onClick={() => bannerInputRef.current?.click()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors">Pilih Gambar</button>
              {bannerImagePreview && (<div className="mt-2"><img src={bannerImagePreview} alt="banner preview" className="max-w-xs rounded-lg border border-slate-200" /></div>)}
              <label className="text-sm font-medium text-slate-700 mt-2 block">Link Tujuan</label>
              <input type="text" value={localBannerLink} onChange={(e) => setLocalBannerLink(e.target.value)} placeholder="https://tokoanda.com/promo" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          )}
          <button onClick={handleSaveBanner} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">Simpan Banner</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Kontrol Asisten AI</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={aiChatEnabled} onChange={(e) => setAiChatEnabled(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" /> Aktifkan Widget Chat AI
          </label>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Catatan Pengetahuan Tambahan untuk AI</label>
          <textarea value={localAiCustomKnowledge} onChange={(e) => setLocalAiCustomKnowledge(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Tambahkan pengetahuan khusus yang akan dibaca oleh asisten AI…" />
          <button onClick={handleSaveAI} className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">Simpan Pengaturan AI</button>
        </div>
      </div>
    </div>
  )
}

export const TabSecurity = ({ config, setConfig, adminPassword, setAdminPassword, showToast, fetchData }) => {
  const [localNewPassword, setLocalNewPassword] = useState('')
  const [localConfirmPassword, setLocalConfirmPassword] = useState('')
  const [newPasswordVisible, setNewPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [maintenanceMode, setMaintenanceMode] = useState(Boolean(config.maintenanceMode))

  useEffect(() => { setMaintenanceMode(Boolean(config.maintenanceMode)) }, [config.maintenanceMode])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!adminPassword) { setPasswordError('Masukkan password admin lama terlebih dahulu.'); return }
    if (!localNewPassword || localNewPassword.length < 4) { setPasswordError('Minimal 4 karakter'); return }
    if (localNewPassword !== localConfirmPassword) { setPasswordError('Tidak cocok'); return }
    try {
      const res = await adminApi('update_password', { password: adminPassword, newPassword: localNewPassword })
      if (res.ok) {
        const d = await res.json()
        setConfig(d.config)
        setLocalNewPassword('')
        setLocalConfirmPassword('')
        setPasswordError('')
        setAdminPassword?.(localNewPassword)
        showToast('Password diubah.', 'success')
        await fetchData()
      } else { setPasswordError('Gagal mengubah password') }
    } catch { setPasswordError('Gagal server') }
  }

  const handleToggleMaintenance = async () => {
    if (!adminPassword) { showToast('Masukkan password admin terlebih dahulu.', 'error'); return }
    try {
      const res = await adminApi('update_config', { maintenanceMode: !maintenanceMode, password: adminPassword })
      if (res.ok) {
        const d = await res.json()
        setConfig(d.config)
        setMaintenanceMode(Boolean(d.config.maintenanceMode))
        await fetchData()
      } else { showToast('Gagal mengubah Mode Maintenance.', 'error') }
    } catch { showToast('Gagal server.', 'error') }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Ubah Password Login /admin</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 mb-1">Password Baru</label>
            <div className="relative">
              <input
                type={newPasswordVisible ? 'text' : 'password'}
                value={localNewPassword}
                onChange={(e) => setLocalNewPassword(e.target.value)}
                placeholder="Masukkan password baru (minimal 6 karakter)"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {newPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 mb-1">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={confirmPasswordVisible ? 'text' : 'password'}
                value={localConfirmPassword}
                onChange={(e) => setLocalConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password baru yang sama"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {confirmPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {passwordError && (<p className="text-sm text-red-600">{passwordError}</p>)}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">Simpan Password Baru</button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Mode Maintenance</h3>
        <p className="text-sm text-slate-500 mb-4">Saat aktif, area upload halaman depan akan dikunci dengan pesan pemeliharaan.</p>
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer">
          <input type="checkbox" checked={maintenanceMode} onChange={handleToggleMaintenance} className="rounded text-blue-600 focus:ring-blue-500" />
          <span>{maintenanceMode ? 'Aktif — Situs dalam pemeliharaan' : 'Nonaktif — Situs normal'}</span>
        </label>
        <p className="text-xs text-slate-400 mt-2">Mode Maintenance dikunci area upload halaman depan saat aktif.</p>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { toast, show } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    // Setelah mount: baca localStorage untuk mempertahankan login saat refresh halaman
    try { setIsAuthenticated(localStorage.getItem('admin_authenticated') === '1') } catch {}
    setIsCheckingAuth(false)
  }, [])
  const [loginPassword, setLoginPassword] = useState('')
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [config, setConfig] = useState({
    brandName: 'AuditToko AI', brandLogoUrl: '', auditPrice: 15000,
    maintenanceMode: false, bannerEnabled: false, bannerType: 'text',
    bannerText: '', bannerColor: 'blue', bannerImageUrl: '', bannerLink: '',
    aiChatEnabled: true, aiCustomKnowledge: '',
  })
  const [vouchers, setVouchers] = useState({ masterCode: 'ADMIN-MASTER-2026', oneTimeCodes: [] })
  const [analytics, setAnalytics] = useState({ visits: [], uploads: [], unlocks: [] })
  const [transactions, setTransactions] = useState([])
  const [supportTickets, setSupportTickets] = useState([])
  const [unrecognizedColumns, setUnrecognizedColumns] = useState([])

  const [activeTab, setActiveTab] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin?action=full', { cache: 'no-store' })
      const data = await res.json()
      setConfig(data.config || config)
      setVouchers(data.vouchers || vouchers)
      setAnalytics(data.analytics || analytics)
      setTransactions(data.transactions || transactions)
      setSupportTickets(data.supportTickets || supportTickets)
      setUnrecognizedColumns(data.unrecognizedColumns || unrecognizedColumns)
    } catch (err) { console.error('Gagal memuat data admin:', err) }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchData(),
        new Promise((resolve) => setTimeout(resolve, 600))
      ])
    } catch (err) {
      console.error('Gagal menyegarkan data:', err)
      show('Gagal menyegarkan data.', 'error')
    } finally {
      setIsRefreshing(false)
      show('Data dasbor berhasil disegarkan!', 'success')
    }
  }

  useEffect(() => { fetchData() }, [fetchData])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await adminApi('login', { password: loginPassword })
      if (res.ok) {
        try { localStorage.setItem('admin_authenticated', '1') } catch {}
        setIsAuthenticated(true); setLoginError(''); setAdminPassword(loginPassword); setLoginPassword(''); fetchData()
        show('Login berhasil.', 'success')
      } else {
        const err = await res.json(); setLoginError(err.error || 'Login gagal')
      }
    } catch { setLoginError('Gagal menghubungi server') }
  }

  const handleResetTestData = async () => {
    if (!adminPassword) { show('Masukkan password admin terlebih dahulu.', 'error'); return }
    try {
      const res = await adminApi('reset_demo', { password: adminPassword })
      if (res.ok) {
        setVouchers({ masterCode: 'ADMIN-MASTER-2026', oneTimeCodes: [] })
        setAnalytics({ visits: [], uploads: [], unlocks: [] })
        setTransactions([]); setSupportTickets([]); setUnrecognizedColumns([])
        show('Data uji coba berhasil di-reset ke 0!', 'success'); await fetchData()
      } else { show('Gagal reset data uji coba.', 'error') }
    } catch { show('Gagal server.', 'error') }
  }

















  const tabs = [
    { id: 1, label: 'Statistik Pengunjung & Audit', icon: <BarChart3 size={18} /> },
    { id: 2, label: 'Laporan Penghasilan & Transaksi', icon: <FileText size={18} /> },
    { id: 3, label: 'Kotak Masuk Keluhan Pelanggan', icon: <Mail size={18} /> },
    { id: 4, label: 'Kode Master & Voucher 1x Pakai', icon: <CreditCard size={18} /> },
    { id: 5, label: 'Log Kolom Asing Marketplace', icon: <Layout size={18} /> },
    { id: 6, label: 'Kontrol Logo, Tarif, Banner & AI', icon: <Palette size={18} /> },
    { id: 7, label: 'Keamanan & Pemeliharaan', icon: <Shield size={18} /> },
  ]

  // Saat masih memeriksa localStorage, render kosong agar tidak muncul halaman login secara sempat
  if (isCheckingAuth) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Masuk ke Admin</h2>
            <p className="text-slate-600">Pusat Komando AuditToko AI</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={loginPasswordVisible ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none pr-10" placeholder="Masukkan password admin"
              />
              <button
                type="button"
                onClick={() => setLoginPasswordVisible(!loginPasswordVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {loginPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {loginError && (<p className="text-sm text-red-600 text-center">{loginError}</p>)}
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-200">
              <LogIn className="w-4 h-4" /> Masuk
            </button>
          </form>
          <p className="mt-6 text-xs text-slate-400 text-center">Halaman admin tersembunyi dari Navbar publik.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-[10000] px-4 py-3 rounded-xl text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {toast.msg}
        </div>
      )}
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
            <span className="font-bold text-slate-900 text-sm">Admin</span>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600"><span className="w-6 h-6">✕</span></button>
          </div>
          <nav className="p-4 space-y-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-blue-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
            <button onClick={() => { try { localStorage.removeItem('admin_authenticated') } catch {}; setIsAuthenticated(false) }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </aside>

        <div className="flex-1 overflow-y-auto p-8 md:pl-64">
          <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors" aria-label="Buka Menu">
                <span className="w-5 h-5">☰</span>
              </button>
              <h1 className="text-2xl font-bold text-slate-900">{tabs.find((t) => t.id === activeTab)?.label}</h1>
              <p className="text-slate-500 text-sm">Pusat Komando Admin AuditToko AI</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleRefresh} disabled={isRefreshing} className={`inline-flex items-center justify-center gap-2 min-w-[125px] px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors ${isRefreshing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <RefreshCw className={`shrink-0 w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Menyegarkan...' : 'Segarkan'}
              </button>
            </div>
          </header>

          {activeTab === 1 && <TabStats analytics={analytics} analyticsPeriod="harian" setAnalytics={setAnalytics} fetchData={fetchData} />}
          {activeTab === 2 && <TabTransactions transactions={transactions} onResetDemo={handleResetTestData} />}
          {activeTab === 3 && <TabInbox supportTickets={supportTickets} fetchData={fetchData} showToast={show} />}
          {activeTab === 4 && <TabVouchers vouchers={vouchers} setVouchers={setVouchers} adminPassword={adminPassword} showToast={show} />}
          {activeTab === 5 && <TabUnrecognized unrecognizedColumns={unrecognizedColumns} />}
          {activeTab === 6 && <TabControls config={config} setConfig={setConfig} adminPassword={adminPassword} showToast={show} fetchData={fetchData} />}
          {activeTab === 7 && <TabSecurity config={config} setConfig={setConfig} adminPassword={adminPassword} setAdminPassword={setAdminPassword} showToast={show} fetchData={fetchData} />}
        </div>
      </div>
    </>
  )
}