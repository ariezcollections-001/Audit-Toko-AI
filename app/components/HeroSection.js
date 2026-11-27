'use client'

import { Zap } from 'lucide-react'

export default function HeroSection() {
  return (
    <section
      id="beranda"
      className="pt-6 pb-3 md:pt-8 md:pb-4 bg-slate-50 overflow-hidden relative"
    >
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-slate-100/60 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-[600px] h-[600px] bg-emerald-50/60 rounded-full blur-[100px] -z-10" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-sm mx-auto mb-4">
            <Zap className="w-3 h-3 text-slate-900" />
            <span className="font-semibold">AuditToko AI</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight mb-4 text-shine">
            Temukan kebocoran profit
            <br className="hidden sm:block" />
            toko Anda dalam 60 detik
          </h1>

          <p className="text-base text-slate-600 leading-relaxed max-w-2xl mx-auto mb-6">
            Unggah laporan penjualan dari Shopee, TikTok Shop, Tokopedia,
            Lazada, atau Bukalapak. Kami akan menemukan biaya tersembunyi,
            deteksi produk rugi, dan sediakan rekomendasi harga jual baru
            yang optimal.
          </p>
        </div>
      </div>
    </section>
  )
}
