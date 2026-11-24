'use client'

import { useState } from 'react'
import { Trash2, Clock, Watch } from 'lucide-react'
import { formatRupiah } from '../lib/analysis'

export default function AuditHistoryList({
  history,
  onLoadHistory,
  onDeleteHistory,
  onClearAllHistory,
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
  )

  if (sortedHistory.length === 0) return null

  const handleDelete = (e, id) => {
    e.stopPropagation()
    setConfirmDeleteId(id)
  }

  const handleConfirmDelete = (id) => {
    onDeleteHistory(id)
    setConfirmDeleteId(null)
  }

  const handleCancelDelete = () => {
    setConfirmDeleteId(null)
  }

  const handleClearAll = () => {
    setConfirmClear(true)
  }

  const handleConfirmClear = () => {
    onClearAllHistory()
    setConfirmClear(false)
  }

  const handleCancelClear = () => {
    setConfirmClear(false)
  }

  return (
    <div className="mt-8 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-500" />
          Riwayat Audit Terakhir di Perangkat Ini
        </h3>
        <button
          onClick={handleClearAll}
          className="text-xs font-medium text-red-600 hover:text-red-800 underline decoration-red-200 hover:decoration-red-400 transition-all"
        >
          Hapus Semua Riwayat
        </button>
      </div>

      <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        {sortedHistory.map((item) => {
          const isCurrent = confirmDeleteId === item.id
          const isPaid = item.isPaid
          const isPaidBadge = isPaid ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
              <Watch className="w-3 h-3" />
              Sudah Terbuka
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
              <Clock className="w-3 h-3" />
              Terkunci
            </span>
          )

          const totalSettlement = item.summary?.settlementAmount || 0
          const totalOrders = item.summary?.totalOrders || 0

          return (
            <div
              key={item.id}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer group"
              onClick={() => onLoadHistory(item.id)}
            >
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-slate-900 truncate max-w-[200px]">
                    {item.fileName}
                  </p>
                  <div className="flex items-center gap-2">
                    {isPaidBadge}
                    <span className="text-xs text-slate-500">
                      {new Date(item.uploadedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-600">
                    {totalOrders} pesanan •
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatRupiah(totalSettlement)}
                  </span>
                  <span className="ml-auto text-slate-400 text-xs">
                    Klik untuk buka laporan
                  </span>
                </div>
              </div>
              {isCurrent ? (
                <div className="bg-red-50 border-t border-red-100 px-6 py-4">
                  <p className="text-xs text-red-700 mb-3">
                    Yakin menghapus riwayat "{item.fileName}"? Tindakan tidak dapat
                    diurungkan.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleConfirmDelete(item.id)}
                      className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => handleDelete(e, item.id)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {confirmClear && (
        <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-sm text-red-700 mb-3">
            Yakin menghapus <b>semua riwayat audit</b> di perangkat ini? Data
            tidak dapat dipulihkan.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirmClear}
              className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Ya, Hapus Semua
            </button>
            <button
              onClick={handleCancelClear}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}