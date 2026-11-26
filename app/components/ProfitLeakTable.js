'use client'

import { useMemo } from 'react'
import { formatRupiah, formatPercent, calculateRecommendedPrice } from '../lib/analysis'
import { AlertTriangle, Truck, Lock } from 'lucide-react'

export default function ProfitLeakTable({
  products,
  claims,
  unlocked,
  packingCost = 0,
  targetProfit = 0.15,
  feeRatio = 0.1,
  packingCostPerProduct = {},
  packingMode = {},
  zoomed = false,
}) {
  // Hitung ulang laba/rugi per produk dan harga jual baru sesuai biaya packing terbaru
  const recompute = useMemo(() => {
    const recomputeProduct = (p) => {
      const units = Math.max(p.unitsSold || 0, 1)
      const orders = p.orders || 0
      const uniqueOrderCount = Number(p.uniqueOrderCount) || orders || 0
      const hppTotal = p.hppTotal || 0
      const hppValue = Number(p.hpp) || 0

      // Biaya packing per produk berdasarkan mode (Per Resi atau Per Pcs)
      const mode = packingMode[p.id] || 'perOrder'
      const packingCostVal = Number(packingCostPerProduct[p.id]) || 0
      const totalPackingProduk = mode === 'perUnit'
        ? packingCostVal * units
        : packingCostVal * uniqueOrderCount
      const packingPerUnit = units > 0 ? totalPackingProduk / units : 0

      // --- Harga jual lama (oldPrice) dari data laporan ---
      const grossRevenue = p.grossRevenue || p.totalGross || 0
      const oldPrice =
        p.productPrice > 0
          ? p.productPrice
          : units > 0
          ? grossRevenue / units
          : 0
      // Uang bersih diterima penjual per unit
      const netReceivedPerUnit =
        units > 0 ? (p.settlementAmount || 0) / units : 0
      // Persentase potongan marketplace nyata per produk (maksimal 75%)
      const computedFeeRate =
        oldPrice > netReceivedPerUnit
          ? Math.min((oldPrice - netReceivedPerUnit) / oldPrice, 0.75)
          : feeRatio

      const netProfitProduk =
        (p.settlementAmount || 0) - (hppValue * units + totalPackingProduk)
      const netProfitPerUnit = units > 0 ? netProfitProduk / units : 0
      const netMarginProduk =
        p.settlementAmount > 0 ? (netProfitProduk / p.settlementAmount) * 100 : 0

      const effectiveHpp = hppValue
      const totalModalUnit = effectiveHpp + packingPerUnit

      const recommendedPrice = calculateRecommendedPrice(
        totalModalUnit,
        computedFeeRate,
        targetProfit
      )

      // Jika produk sebelumnya berstatus Rugi dan recommendedPrice <= oldPrice,
      // naikkan minimal 1 langkah .900 di atas oldPrice
      let finalRecommendedPrice = recommendedPrice
      if (
        netProfitProduk < 0 &&
        finalRecommendedPrice > 0 &&
        finalRecommendedPrice <= oldPrice
      ) {
        finalRecommendedPrice = Math.ceil(oldPrice / 1000) * 1000 - 100
        if (finalRecommendedPrice <= oldPrice) finalRecommendedPrice += 1000
      }

      // Simulasi real pada harga baru
      const realNetRevenue =
        finalRecommendedPrice > 0
          ? finalRecommendedPrice * (1 - computedFeeRate)
          : 0
      const realProfitPerUnit =
        finalRecommendedPrice > 0 ? realNetRevenue - totalModalUnit : 0
      const realMarginPercent =
        finalRecommendedPrice > 0
          ? (realProfitPerUnit / finalRecommendedPrice) * 100
          : 0

      let priceDiff = finalRecommendedPrice - oldPrice
      // Jika belum diisi HPP, paksa selisih harga = 0 (jangan tampilkan negatif seperti -oldPrice)
      if (hppValue === 0 && packingCostVal === 0) {
        priceDiff = 0
      }

      // Jika harga rekomendasi <= harga lama, jangan sarankan turun harga
      const isPriceSafe = finalRecommendedPrice > 0 && finalRecommendedPrice <= oldPrice
      const isMarginAboveTarget = finalRecommendedPrice > 0 && finalRecommendedPrice < oldPrice

      // Potongan marketplace per unit
      const marketplaceDeductionPerUnit = oldPrice * computedFeeRate

      // Status baru yang berubah real-time sesuai pilihan profit
      let statusBaru
      let statusColor
      if (realProfitPerUnit <= 0) {
        statusBaru = 'Rugi'
        statusColor = 'text-red-600 bg-red-50 border-red-200'
      } else if (isMarginAboveTarget) {
        statusBaru = 'Sehat (Harga Lama Sudah di Atas Target)'
        statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200'
      } else if (realMarginPercent > 0 && realMarginPercent < 10) {
        statusBaru = 'Margin Tipis'
        statusColor = 'text-amber-600 bg-amber-50 border-amber-200'
      } else {
        statusBaru = 'Sehat (Untung)'
        statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200'
      }

      const oldProfitPerUnit = oldPrice > 0 ? (oldPrice - marketplaceDeductionPerUnit - totalModalUnit) : 0

      return {
        ...p,
        netProfitProduk: Math.round(netProfitProduk),
        netMarginProduk,
        oldPrice: Math.round(oldPrice),
        oldProfitPerUnit: Math.round(oldProfitPerUnit),
        feeRate: computedFeeRate,
        recommendedPrice: finalRecommendedPrice !== null ? Math.round(finalRecommendedPrice) : 0,
        currentPrice: isFinite(oldPrice) ? Math.round(oldPrice) : 0,
        priceDiff: isFinite(priceDiff) ? Math.round(priceDiff) : 0,
        estProfitPerPcs: isFinite(realProfitPerUnit) ? Math.round(realProfitPerUnit) : 0,
        netReceivedPerUnit: Math.round(netReceivedPerUnit),
        realMarginPercent,
        isPriceSafe,
        isMarginAboveTarget,
        statusBaru,
        statusColor,
        marketplaceDeductionPerUnit: Math.round(marketplaceDeductionPerUnit),
        hppValue,
        packingPerUnit,
        totalModalUnit: Math.round(totalModalUnit),
        packingMode: mode,
        packingCostVal,
        uniqueOrderCount,
      }
    }

    return {
      products: products.map(recomputeProduct),
    }
  }, [products, packingCost, targetProfit, feeRatio, packingCostPerProduct, packingMode])

  // Render baris tabel dengan 7 kolom transparan
  const renderProductRows = (products) => {
    return products.map((row) => {
      const units = Math.max(row.unitsSold || 0, 1)
      const totalOldProfit =
        (row.oldPrice -
          row.marketplaceDeductionPerUnit -
          row.totalModalUnit) *
        units
      const diff = row.priceDiff || 0

      return (
        <tr key={row.id}>
          {/* Kolom 1: Produk */}
          <td className="px-4 py-3">
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-xs text-gray-500">Terjual: {units} pcs</div>
          </td>
          {/* Kolom 2: Harga Jual Lama */}
          <td className={`px-4 py-3 text-right text-gray-600 font-medium ${!unlocked ? 'blur-sm select-none' : ''}`}>
            {row.oldPrice > 0 ? formatRupiah(Math.round(row.oldPrice)) : '-'}
          </td>
          {/* Kolom 3: Potongan Marketplace */}
          <td className={`px-4 py-3 text-right text-gray-600 ${!unlocked ? 'blur-sm select-none' : ''}`}>
            {row.oldPrice > 0 ? (
              <>
                -{formatRupiah(Math.round(row.marketplaceDeductionPerUnit))}
                <br />
                <span className="text-[10px] text-gray-400">
                  ({(row.feeRate * 100).toFixed(1)}%)
                </span>
              </>
            ) : '-'}
          </td>
          {/* Kolom 4: Modal + Packing */}
          <td className={`px-4 py-3 text-right text-gray-600 font-medium ${!unlocked ? 'blur-sm select-none' : ''}`}>
            {formatRupiah(Math.round(row.totalModalUnit))}
            <br />
            <span className="text-[10px] text-gray-400">HPP + Packing</span>
          </td>
          {/* Kolom 5: Laba/Rugi Lama — STATIS, tidak berubah saat target profit diklik */}
          <td className={`px-4 py-3 text-right font-semibold ${!unlocked ? 'blur-sm select-none' : ''}`}>
            <div className="flex flex-col">
              <span className={`font-medium ${row.oldProfitPerUnit > 0 ? 'text-emerald-600' : row.oldProfitPerUnit < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {row.hppValue === 0 && row.packingCostVal === 0
                  ? `+Rp ${row.netReceivedPerUnit > 0 ? Math.round(row.netReceivedPerUnit) : 0}`
                  : row.oldProfitPerUnit > 0
                    ? `+Rp ${Math.round(row.oldProfitPerUnit).toLocaleString('id-ID')}`
                    : row.oldProfitPerUnit < 0
                      ? `−Rp ${Math.abs(Math.round(row.oldProfitPerUnit)).toLocaleString('id-ID')}`
                      : `Rp 0`}
                {row.oldPrice > 0 && Math.abs(row.oldProfitPerUnit) > 0.01 ? ` (${((row.oldProfitPerUnit / row.oldPrice) * 100).toFixed(1)}%)` : ''}
              </span>
              <span className={`text-[10px] ${totalOldProfit > 0 ? 'text-emerald-600' : totalOldProfit < 0 ? 'text-red-600' : 'text-gray-400'}`}>{units > 0 ? `Total ${units} pcs: ${formatRupiah(Math.round(totalOldProfit))}` : ''}</span>
            </div>
          </td>
          {/* Kolom 6: Harga Jual Baru */}
          <td className={`px-4 py-3 text-right font-semibold relative group ${!unlocked ? 'blur-sm select-none' : ''}`}>
            {row.hppValue === 0 && row.packingCostVal === 0 ? (
              <div className="flex flex-col items-end gap-1">
                <span className="text-gray-400 text-sm font-medium">-</span>
                <span className="text-[10px] text-gray-400">Isi HPP di Langkah 2</span>
              </div>
            ) : row.recommendedPrice > 0 ? (
              <>
                {formatRupiah(Math.round(row.recommendedPrice))}
                {row.recommendedPrice < row.oldPrice ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 mt-1">
                    Harga lama sudah berada di atas target, silahkan naikkan target profit
                  </span>
                ) : diff > 0 ? (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap shadow-sm z-10">
                    +{formatRupiah(Math.round(diff)).replace('Rp ', '')}
                  </span>
                ) : null}
              </>
            ) : '-'}
          </td>
          {/* Kolom 7: Untung Baru & Status */}
          <td className={`px-4 py-3 ${!unlocked ? 'blur-sm select-none' : ''}`}>
            {row.hppValue === 0 && row.packingCostVal === 0 ? (
              <div className="flex flex-col items-end gap-1">
                <span className="text-gray-400 text-sm font-medium">-</span>
                <span className="text-[10px] text-gray-400">Isi HPP di Langkah 2</span>
              </div>
            ) : (
              <div className="text-right flex flex-col items-end gap-0.5">
                {/* Baris 1: Utama, tebal, pemisah ribuan titik */}
                <span className="text-emerald-600 font-medium">
                  {row.estProfitPerPcs > 0
                    ? `+Rp ${Math.round(row.estProfitPerPcs).toLocaleString('id-ID')} / pcs (${formatPercent(row.realMarginPercent || 0)})`
                    : row.estProfitPerPcs < 0
                    ? `−Rp ${Math.abs(Math.round(row.estProfitPerPcs)).toLocaleString('id-ID')} / pcs (${formatPercent(row.realMarginPercent || 0)})`
                    : `Rp 0 / pcs (${formatPercent(0)})`}
                </span>
                {/* Baris 2: Total per qty pcs, teks kecil abu-abu */}
                <span className="text-[10px] text-gray-400">
                  {units > 0 ? `Total ${units} pcs: ${formatRupiah(Math.round(row.estProfitPerPcs * units))}` : ''}
                </span>
                {/* Baris 3: Lencana status ringkas */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${row.statusColor}`}>
                  {row.statusBaru === 'Sehat (Harga Lama Sudah di Atas Target)' || row.statusBaru === 'Sehat (Untung)'
                    ? 'Sehat'
                    : row.statusBaru}
                </span>
              </div>
            )}
          </td>
        </tr>
      )
    })
  }

  return (
    <div className={`overflow-hidden${zoomed ? ' flex flex-1 flex-col' : ''} ${!zoomed ? 'bg-white rounded-2xl border border-gray-200 shadow-sm' : ''}`}>


      {!unlocked && (
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
            <Lock className="w-8 h-8 text-gray-500" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Detail Terkunci</h4>
          <p className="text-sm text-gray-500 mb-4">
            
          </p>
        </div>
      )}
      {unlocked && (
        <div className={`${zoomed ? 'flex-1 flex flex-col' : 'p-6 space-y-6'}`}>
          {/* Semua produk dalam urutan asli laporan (tidak diurutkan ulang) */}
          {(() => {
            const allProducts = recompute.products

            if (allProducts.length === 0) {
              return (
                <div className="text-center py-8 text-slate-500">
                  <p>Tidak ada produk yang ditemukan dalam laporan.</p>
                </div>
              )
            }

            const hasMissingHpp = allProducts.some(p => !p.hpp || p.hpp === 0)

            return (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-amber-700">Analisis Profit & Rekomendasi Harga</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  
                </p>

                {/* === TABEL PRODUK — hanya isi tabel yang scroll, thead tetap diam === */}
                <div className={`overflow-x-auto overflow-y-auto ${zoomed ? 'flex-1 shrink-0' : 'max-h-[420px] shrink-0'}`}>
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-20 bg-amber-50 border-b border-amber-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase">Produk</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase">Harga Jual Lama</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase">Potongan Marketplace</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase">Modal + Packing</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase">Laba/Rugi Lama</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase">
                    Harga Jual Baru
                    <p className="text-[10px] text-amber-500 mt-0.5">Sesuai target profit terpilih</p>
                  </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase">Untung Baru &amp; Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {renderProductRows(allProducts)}
                    </tbody>
                  </table>
                </div>
              </>
            )
          })()}
          {/* === SELISIH ONGKIR & BIAYA RETUR — disembunyikan saat layar diperbesar === */}
          {!zoomed && claims.length > 0 && (
            <div className="shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-blue-700">🔵 Selisih Ongkir & Biaya Retur</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Pesanan dengan selisih berat/ongkir tidak wajar atau retur yang memotong biaya admin.
              </p>
              <table className="w-full text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">No. Pesanan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Produk</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Resi</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-blue-700 uppercase">Selisih Ongkir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {claims.map((c) => (
                    <tr key={c.orderId}>
                      <td className="px-4 py-3 text-gray-900 font-medium">{c.orderId}</td>
                      <td className="px-4 py-3 text-gray-600">{c.product}</td>
                      <td className="px-4 py-3 text-gray-600">{c.resi}</td>
                      <td className="px-4 py-3 text-right text-blue-600 font-semibold">
                        {formatRupiah(c.difference)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

