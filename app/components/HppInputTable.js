'use client'
import { useState, useEffect } from 'react'
import { formatRupiah } from '../lib/analysis'
import { DollarSign, RefreshCw, Maximize2, Minimize2 } from 'lucide-react'

export default function HppInputTable({
  products,
  onHppChange,
  packingCost = 0,
  setPackingCost,
  packingCostPerProduct = {},
  onPackingCostChange,
  adCostPeriod = 0,
  onAdCostChange,
  totalAllUnits = 0,
  totalUnitsSuccess = 0,
  totalUnitsReturned = 0,
  returnedOrders = [],
  isPaid = false,
}) {

  const [isZoomed, setIsZoomed] = useState(false)

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isZoomed) setIsZoomed(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isZoomed])

  const handleHppChange = (productId, value) => {
    const num = value === '' ? 0 : parseFloat(value) || 0
    onHppChange(productId, num)
  }

  const handlePackingCostChange = (productId, value) => {
    const num = value === '' ? 0 : parseFloat(value) || 0
    if (onPackingCostChange) onPackingCostChange(productId, num)
  }

  return (
    <div className={isZoomed ? 'fixed inset-0 z-50 bg-white flex flex-col' : 'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shadow-premium'}>
      {isZoomed ? (
        <>
          {/* ===== BAR ATAS (Fixed di Atas, shrink-0) ===== */}
          <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-slate-900 text-sm">Input Modal &amp; Packing</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Input Total Biaya Iklan — nuansa merah */}
              <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-lg">
                <label className="text-xs text-red-700 font-medium leading-none">Total Biaya Iklan / Ads (Rp)</label>
                <span className="text-red-700 text-xs font-medium leading-none">Rp</span>
                <input
                  defaultValue={String(adCostPeriod)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    const val = raw ? parseInt(raw) : 0
                    if (onAdCostChange) onAdCostChange(val)
                  }}
                  className="w-24 px-2 py-1 bg-white border border-red-300 rounded text-right text-[11px] font-medium text-red-900 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none placeholder-red-400"
                  placeholder="0"
                />
              </div>
              <button
                onClick={() => onHppChange('RESET_ALL', 0)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-xs font-medium transition shadow-sm"
              >
                <RefreshCw className="w-3 h-3" /> Reset Semua ke 0
              </button>
              {totalAllUnits > 0 && (
                <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800 leading-tight">
                    Total Barang: {totalUnitsSuccess + returnedOrders.reduce((sum, item) => sum + (Number(item.qty) || 1), 0)} pcs ({totalUnitsSuccess} Sukses • {returnedOrders.reduce((sum, item) => sum + (Number(item.qty) || 1), 0)} Retur)
                  </p>
                </div>
              )}
              <button
                onClick={() => setIsZoomed(false)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200"
              >
                <Minimize2 className="w-3 h-3" /> Selesai &amp; Perkecil Layar
              </button>
            </div>
          </div>

          {/* ===== AREA TABEL PRODUK 1 LAPIS PENUH (flex-1 overflow-y-auto) ===== */}
          <div className="flex-1 overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Produk</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Terjual</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Harga Jual &amp; Dana Cair / pcs</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Modal HPP / PCS</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Biaya Packing / Pcs</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Laba/Rugi &amp; Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const units = Math.max(p.unitsSold || 0, 1)
                    const avgPrice = p.unitsSold > 0 ? p.grossRevenue / p.unitsSold : 0
                    const hppValue = Number(p.hpp) || 0
                    const packingCostVal = Number(packingCostPerProduct[p.id]) || 0
                    const totalPackingProduk = packingCostVal * units
                    const oldPrice = p.productPrice > 0 ? p.productPrice : avgPrice
                    const netPerUnit = p.settlementAmount > 0 ? p.settlementAmount / units : 0
                    const deductionPerUnit = oldPrice - netPerUnit
                    const netProfitProduk = (p.settlementAmount || 0) - (hppValue * units + totalPackingProduk)
                    const marginPercent = p.settlementAmount > 0 ? (netProfitProduk / p.settlementAmount) * 100 : 0
                    let statusBaru, statusColor
                    if (netProfitProduk <= 0) {
                      statusBaru = 'Rugi'
                      statusColor = 'text-red-600 bg-red-50 border-red-200'
                    } else if (marginPercent > 0 && marginPercent < 10) {
                      statusBaru = 'Margin Tipis'
                      statusColor = 'text-amber-600 bg-amber-50 border-amber-200'
                    } else {
                      statusBaru = 'Sehat'
                      statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200'
                    }
                    const rowBadge = statusBaru === 'Rugi' ? 'bg-red-50' : statusBaru === 'Margin Tipis' ? 'bg-amber-50' : 'bg-emerald-50'
                    return (
                      <tr key={p.id} className={`${rowBadge} hover:bg-slate-50/50 transition shadow-sm shadow-hover`}>
                        <td className="px-6 py-3"><div className="font-medium text-slate-900">{p.name}</div></td>
                        <td className="px-6 py-3 text-right text-slate-600 font-medium">{p.unitsSold}</td>
                        <td className="px-6 py-3 text-right text-slate-600 font-medium">
                          <div className="text-right leading-tight">
                            <div className="text-sm text-slate-700 font-medium whitespace-nowrap">Jual: {formatRupiah(oldPrice)}</div>
                            <div className="text-xs text-red-600 whitespace-nowrap">Potongan: -{formatRupiah(deductionPerUnit)}</div>
                            <div className="text-xs font-bold text-emerald-700 whitespace-nowrap">Cair: {formatRupiah(netPerUnit)}/pcs</div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <input type="number" value={p.hpp > 0 ? p.hpp : ''} onChange={(e) => handleHppChange(p.id, e.target.value)} className="w-24 px-3 py-2 text-right bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm" min="0" step="100" placeholder="0" />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <input type="number" value={packingCostVal > 0 ? packingCostVal : ''} onChange={(e) => handlePackingCostChange(p.id, e.target.value)} className="w-24 px-3 py-2 text-right bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" min="0" step="100" placeholder="0" />
                        </td>
                        <td className="px-6 py-3 text-right font-semibold">
                          <div className="text-right">
                            {isPaid ? (
                              <>
                                {hppValue > 0 ? (
                                  <>
                                    <span className={`${statusBaru === 'Rugi' ? 'text-red-600' : statusBaru === 'Margin Tipis' ? 'text-amber-600' : 'text-slate-800'}`}>{formatRupiah(netProfitProduk)}</span><br />
                                    <span className={`text-[10px] ${netProfitProduk > 0 ? 'text-emerald-600' : netProfitProduk < 0 ? 'text-red-600' : 'text-gray-500'} font-medium`}>{netProfitProduk > 0 ? '+' : netProfitProduk < 0 ? '−' : ''}{formatRupiah(Math.abs(netProfitProduk / units))} / pcs</span>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-gray-500 font-medium">Isi Modal HPP (dan Biaya Packing jika ada) untuk melihat laba/rugi</span>
                                )}
                                {hppValue > 0 && (
                                  <>
                                    <br />
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                                      {statusBaru}
                                    </span>
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                {hppValue > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-slate-300 bg-slate-100 text-slate-600 text-xs font-semibold">Siap Dihitung</span>
                                ) : (
                                  <span className="text-[10px] text-gray-500 font-medium">Isi Modal HPP</span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )})}
                    {products.length === 0 && (
                      <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Belum ada data produk. Silakan unggah laporan terlebih dahulu.</td></tr>
                    )}
                  </tbody>
                </table>
            </div>
        </>
      ) : (
        <>
          {/* ===== Kotak Total Biaya Iklan — merah lembut tegas (bg-red-50 border-red-300) ===== */}
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl shadow-sm">
            <div className="flex items-center gap-4 justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Total Biaya Iklan / Ads Periode Ini (Opsional - Rp)</p>
                <p className="text-[10px] text-red-600">
                  Masukkan total pengeluaran iklan (Shopee Ads / TikTok Ads / TopAds) selama periode laporan ini jika Anda beriklan. Jika tidak ada potongan/pengeluaran iklan, tidak perlu diisi (biarkan Rp 0).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-700 text-sm">Rp</span>
                <input
                  defaultValue={String(adCostPeriod)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    const val = raw ? parseInt(raw) : 0
                    if (onAdCostChange) onAdCostChange(val)
                  }}
                  className="w-32 px-3 py-2 bg-white border border-red-400 rounded-lg text-right text-sm font-medium text-red-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* ===== Panel Kontrol (bar kontrol) — dipindahkan keluar dari kontainer scroll tabel ===== */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-slate-600" />
              <h3 className="font-bold text-slate-900">Input Modal &amp; Packing</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onHppChange('RESET_ALL', 0)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium transition shadow-sm shadow-hover"
              >
                <RefreshCw className="w-4 h-4" /> Reset Semua ke 0
              </button>
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm shadow-hover ${isZoomed ? 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'}`}
              >
                {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                {isZoomed ? 'Selesai & Perkecil Layar' : 'Perbesar Layar'}
              </button>
            </div>
          </div>

          {/* ===== Info Total Barang di File Laporan ===== */}
          {totalAllUnits > 0 && (
            <div className="px-6 py-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">
                Total Barang di File Laporan: {totalUnitsSuccess + returnedOrders.reduce((sum, item) => sum + (Number(item.qty) || 1), 0)} pcs ({totalUnitsSuccess} pcs Sukses Terjual • {returnedOrders.reduce((sum, item) => sum + (Number(item.qty) || 1), 0)} pcs Retur)
              </p>
            </div>
          )}

          {/* ===== Kontainer Scroll Tabel Produk ===== */}
          <div className="overflow-x-auto overflow-y-auto max-h-[420px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200">
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Produk</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Terjual</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Harga Jual &amp; Dana Cair / pcs</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Modal HPP / PCS</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Biaya Packing / Pcs</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Laba/Rugi &amp; Status<br/><span className="text-[10px] text-slate-400">(Setelah potong modal &amp; packing)</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
            {products.map((p) => {
      const units = Math.max(p.unitsSold || 0, 1)
      const avgPrice = p.unitsSold > 0 ? p.grossRevenue / p.unitsSold : 0
      const hppValue = Number(p.hpp) || 0
      const packingCostVal = Number(packingCostPerProduct[p.id]) || 0
      const totalPackingProduk = packingCostVal * units

      // Rincian Harga Jual & Dana Cair per pcs (enhancement 1)
      const oldPrice = p.productPrice > 0 ? p.productPrice : avgPrice
      const netPerUnit = p.settlementAmount > 0 ? p.settlementAmount / units : 0
      const deductionPerUnit = oldPrice - netPerUnit

              // Sama persis dengan ProfitLeakTable: netProfit = settlement - (hpp * units + totalPacking)
              const netProfitProduk = (p.settlementAmount || 0) - (hppValue * units + totalPackingProduk)
              const marginPercent = p.settlementAmount > 0 ? (netProfitProduk / p.settlementAmount) * 100 : 0

              // Sama status logic dengan ProfitLeakTable
              let statusBaru, statusColor
              if (netProfitProduk <= 0) {
                statusBaru = 'Rugi'
                statusColor = 'text-red-600 bg-red-50 border-red-200'
              } else if (marginPercent > 0 && marginPercent < 10) {
                statusBaru = 'Margin Tipis'
                statusColor = 'text-amber-600 bg-amber-50 border-amber-200'
              } else {
                statusBaru = 'Sehat'
                statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200'
              }

              const rowBadge = statusBaru === 'Rugi' ? 'bg-red-50' : statusBaru === 'Margin Tipis' ? 'bg-amber-50' : 'bg-emerald-50'
              return (
                <tr key={p.id} className={`${rowBadge} hover:bg-slate-50/50 transition shadow-sm shadow-hover`}>
                  {/* Kolom 1: Produk */}
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{p.name}</div>
                  </td>
                  {/* Kolom 2: Terjual */}
                  <td className="px-6 py-4 text-right text-slate-600 font-medium">
                    {p.unitsSold}
                  </td>
                  {/* Kolom 3: Harga Jual & Dana Cair/Pcs */}
                  <td className="px-6 py-4 text-right text-slate-600 font-medium">
                    <div className="text-right leading-tight">
                      <div className="text-sm text-slate-700 font-medium whitespace-nowrap">Jual: {formatRupiah(oldPrice)}</div>
                      <div className="text-xs text-red-600 whitespace-nowrap">Potongan: -{formatRupiah(deductionPerUnit)}</div>
                      <div className="text-xs font-bold text-emerald-700 whitespace-nowrap">Cair: {formatRupiah(netPerUnit)}/pcs</div>
                    </div>
                  </td>
                  {/* Kolom 4: Modal HPP (Rp) */}
                  <td className="px-6 py-4 text-right">
                    <input
                      type="number"
                      value={p.hpp > 0 ? p.hpp : ''}
                      onChange={(e) => handleHppChange(p.id, e.target.value)}
                      className="w-24 px-3 py-2 text-right bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                      min="0"
                      step="100"
                      placeholder="0"
                    />
                  </td>
                  {/* Kolom 5: Biaya Packing (Rp) */}
                  <td className="px-6 py-4 text-right">
                    <input
                      type="number"
                      value={packingCostVal > 0 ? packingCostVal : ''}
                      onChange={(e) => handlePackingCostChange(p.id, e.target.value)}
                      className="w-24 px-3 py-2 text-right bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      min="0"
                      step="100"
                      placeholder="0"
                    />
                  </td>                  {/* Kolom 7: Laba/Rugi & Status — tersembunyi sebelum pembayaran QRIS */}
                  <td className="px-6 py-4 text-right font-semibold">
                    <div className="text-right">
                      {/* Setelah bayar: tampilkan angka & status lengkap */}
                      {isPaid ? (
                        <>
                          {hppValue > 0 ? (
                            <>
                              <span className={`${statusBaru === 'Rugi' ? 'text-red-600' : statusBaru === 'Margin Tipis' ? 'text-amber-600' : 'text-slate-800'}`}>
                                {formatRupiah(netProfitProduk)}
                              </span>
                              <br />
                              <span className={`text-[10px] ${netProfitProduk > 0 ? 'text-emerald-600' : netProfitProduk < 0 ? 'text-red-600' : 'text-gray-500'} font-medium`}>
                                {netProfitProduk > 0 ? '+' : netProfitProduk < 0 ? '−' : ''}{formatRupiah(Math.abs(netProfitProduk / units))} / pcs
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-500 font-medium">
                              Isi Modal HPP (dan Biaya Packing jika ada) untuk melihat laba/rugi
                            </span>
                          )}
                          {hppValue > 0 && (
                            <>
                              <br />
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                                {statusBaru}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Belum bayar: tampilkan lencana netral, tanpa angka rupiah dan tanpa status Sehat/Rugi */}
                          {hppValue > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-slate-300 bg-slate-100 text-slate-600 text-xs font-semibold">
                              Siap Dihitung
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500 font-medium">
                              Isi Modal HPP
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            }
            )}
            {products.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  Belum ada data produk. Silakan unggah laporan terlebih dahulu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      {returnedOrders.length > 0 && !isZoomed && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg overflow-hidden">
          <div className="bg-red-100 px-6 py-2 flex justify-between items-center">
            <h4 className="text-sm font-semibold text-red-800 uppercase">Rincian Barang Retur & Pengembalian Dana</h4>
            <span className="text-xs text-red-600">{returnedOrders.length} pesanan retur</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-red-700 uppercase">No. Pesanan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-red-700 uppercase">Jenis Barang (Nama & SKU)</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-red-700 uppercase">Jumlah (Pcs)</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-red-700 uppercase">Harga Produk (Rp)</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-red-700 uppercase">Nominal Refund (Rp)</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-red-700 uppercase">Biaya Hangus Admin/Ongkir (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {returnedOrders.map((r) => (
                  <tr key={`${r.orderId}-${r.productName}-${r.sku}`} className="bg-white/50">
                    <td className="px-6 py-3 text-left text-xs text-gray-800 font-medium">{r.orderId}</td>
                    <td className="px-6 py-3 text-left text-xs text-gray-700 truncate max-w-[200px]">
                      {r.productName}{r.sku && r.sku !== '-' ? ` (${r.sku})` : ''}
                    </td>
                    <td className="px-6 py-3 text-right text-xs text-gray-700">{r.qty}</td>
                    <td className="px-6 py-3 text-right text-xs text-gray-700">{formatRupiah(r.productPrice)}</td>
                    <td className="px-6 py-3 text-right text-xs text-red-600 font-semibold">-{formatRupiah(r.refundAmount)}</td>
                    <td className="px-6 py-3 text-right text-xs text-red-600 font-semibold">-{formatRupiah(r.lostFeeAmount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-red-100">
                <tr>
                  <td className="px-6 py-3 text-left text-xs font-semibold text-gray-700" colSpan="2">Total Retur</td>
                  <td className="px-6 py-3 text-right text-xs font-semibold text-gray-700">
                    {returnedOrders.reduce((acc, r) => acc + r.qty, 0)}
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-gray-500"></td>
                  <td className="px-6 py-3 text-right text-xs font-semibold text-red-700">
                    -{formatRupiah(returnedOrders.reduce((acc, r) => acc + r.refundAmount, 0))}
                  </td>
                  <td className="px-6 py-3 text-right text-xs font-semibold text-red-700">
                    -{formatRupiah(returnedOrders.reduce((acc, r) => acc + r.lostFeeAmount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Peringatan HPP Belum Diisi — hanya setelah bayar agar tidak menyesatkan */}
      {isPaid && products.some((p) => (Number(p.hpp) || 0) === 0) && !isZoomed && (
        <div className="px-6 py-4 border-t border-amber-200 bg-amber-50/50 mt-4 rounded-b-2xl">
          <div className="flex items-start gap-3">
            <span className="text-amber-600 font-bold">⚠️</span>
            <div className="text-sm text-amber-700">
              <p className="font-semibold">Beberapa produk belum diisi Harga Modal (HPP)</p>
              <p className="text-[11px] text-amber-600 mt-1">
                HPP kosong dihitung sebagai Rp 0, sehingga Laba/Rugi yang ditampilkan dapat TIDAK AKURAT dan terlalu tinggi. Silakan isi HPP untuk setiap produk agar hasil audit akurat.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`px-6 py-4 border-t border-slate-100 bg-amber-50 border-amber-200 mt-4 rounded-b-2xl ${!isZoomed ? '' : 'hidden'}`}>
        <p className="text-xs text-amber-700 font-medium">
        
        </p>
      </div>
      </>
      )}
  </div>
)
}