'use client'

import { useState, useCallback } from 'react'
import { Clock, Watch, Check, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { formatRupiah } from '../lib/analysis.cjs'

export default function AuditHistoryList({
  history,
  onLoadHistory,
  onDeleteHistory,
  onDeleteSelectedHistory,
  onClearAllHistory,
  onDeleteComplete,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
  )

  const selectedCount = selectedIds.size
  const hasSelection = selectedCount > 0

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedCount === sortedHistory.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedHistory.map((i) => i.id)))
    }
  }, [selectedCount, sortedHistory])

  const handleConfirmDeleteSelected = () => {
    if (isDeleting) return
    setIsDeleting(true)
    setTimeout(() => {
      if (onDeleteSelectedHistory && selectedIds.size > 0) {
        onDeleteSelectedHistory([...selectedIds])
      }
      setSelectedIds(new Set())
      setConfirmDelete(false)
      setIsDeleting(false)
      if (onDeleteComplete) onDeleteComplete()
    }, 700)
  }

  const handleConfirmClearAll = () => {
    if (isDeleting) return
    setIsDeleting(true)
    setTimeout(() => {
      onClearAllHistory()
      setSelectedIds(new Set())
      setConfirmDelete(false)
      setIsDeleting(false)
      if (onDeleteComplete) onDeleteComplete()
    }, 700)
  }

  if (sortedHistory.length === 0) return null

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* Header: Select All + Bulk Action Buttons */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={sortedHistory.length > 0 && selectedCount === sortedHistory.length}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600 font-medium">
            Pilih Semua ({selectedCount} terpilih)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={!hasSelection}
              className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hapus Terpilih ({selectedCount})
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-1 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            Hapus Semua
          </button>
        </div>
      </div>
      {sortedHistory.map((item) => {
        const isSelected = selectedIds.has(item.id)
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
            className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer group ${isSelected ? 'bg-blue-50' : ''}`}
            onClick={() => onLoadHistory(item.id)}
          >
            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 cursor-pointer shrink-0"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleSelect(item.id)
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="font-medium text-slate-900 truncate max-w-[200px]">
                    {item.fileName}
                  </p>
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
              <div className="flex items-center gap-2">
                {isPaidBadge}
                <span className="text-xs text-slate-400 font-medium">
                  {totalOrders} pesanan • {formatRupiah(totalSettlement)}
                </span>
              </div>
            </div>
          </div>
        )
      })}

      {/* Konfirmasi Hapus */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-200 w-full max-w-md mx-4 transform transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Konfirmasi Hapus Riwayat
                </h3>
                <p className="text-slate-600 text-sm">
                  Yakin ingin menghapus{' '}{hasSelection ? <strong>{selectedCount} riwayat</strong> : <strong>semua riwayat audit</strong>}? Data yang dihapus tidak dapat dipulihkan kembali.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={hasSelection ? handleConfirmDeleteSelected : handleConfirmClearAll}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Menghapus riwayat...
                  </>
                ) : (
                  'Ya, Hapus Permanen'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}