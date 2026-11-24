'use client'
export default function Footer({
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
            <div className="flex items-center gap-3 mb-4" onClick={onLogoClick}>
              <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402 2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                AuditToko <span className="text-slate-400">AI</span>
              </span>
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
