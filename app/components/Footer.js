'use client'
import { DollarSign } from 'lucide-react'

export default function Footer({
  brandName = 'AuditToko AI',
  onPrivacyClick,
  onDownloadGuideClick,
  onBerandaClick,
  onLogoClick,
  onCaraKerjaClick,
  onHargaClick,
  onMulaiAnalisisClick,
}) {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12 mt-auto text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center justify-start gap-2 w-fit mb-4" onClick={onLogoClick}>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <DollarSign className="w-5 h-5 text-slate-900" />
              </div>
              <span className="text-white font-bold text-lg">{brandName}</span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs">
              Platform audit laporan penjualan &amp; kalkulator harga jual otomatis untuk penjual marketplace Indonesia.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Produk</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={onBerandaClick} className="text-left w-full hover:text-white transition-colors">Beranda</button></li>
              <li><button onClick={onCaraKerjaClick} className="text-left w-full hover:text-white transition-colors">Cara Kerja</button></li>
              <li><button onClick={onMulaiAnalisisClick} className="text-left w-full hover:text-white transition-colors">Mulai Analisis</button></li>
              <li><button onClick={onHargaClick} className="text-left w-full hover:text-white transition-colors">Harga</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={onPrivacyClick}
                  className="text-left w-full hover:text-white transition-colors"
                >
                  Kebijakan Privasi &amp; Keamanan Data
                </button>
              </li>
              <li>
                <button
                  onClick={onDownloadGuideClick}
                  className="text-left w-full hover:text-white transition-colors"
                >
                  Cara Download Laporan Marketplace
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} AuditToko AI. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-slate-500">
            <span>Dikembangkan untuk penjual marketplace Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
