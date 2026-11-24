'use client'

import { useState } from 'react'
import { ShoppingBag, Megaphone, Store, Zap, Search } from 'lucide-react'

const MARKETPLACES = [
  { id: 'shopee', label: 'Shopee', icon: ShoppingBag, color: 'bg-orange-500' },
  { id: 'tiktok', label: 'TikTok Shop', icon: Megaphone, color: 'bg-slate-900' },
  { id: 'tokopedia', label: 'Tokopedia', icon: Store, color: 'bg-indigo-600' },
  { id: 'lazada', label: 'Lazada', icon: Zap, color: 'bg-indigo-600' },
  { id: 'bukalapak', label: 'Bukalapak', icon: Search, color: 'bg-rose-600' },
  { id: 'auto', label: 'Deteksi Otomatis', icon: Search, color: 'bg-slate-500' },
]

export default function MarketplaceTabs({ onChange, defaultValue = 'auto' }) {
  const [active, setActive] = useState(defaultValue)

  return (
    <div className="w-full mb-8">
      <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
        {MARKETPLACES.map((mp) => {
          const isActive = active === mp.id
          const Icon = mp.icon
          return (
            <button
              key={mp.id}
              onClick={() => {
                setActive(mp.id)
                onChange(mp.id)
              }}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? `${mp.color} text-white shadow-md`
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {mp.label}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-slate-500 mt-3 text-center lg:text-left max-w-md mx-auto lg:mx-0">
        Pilih marketplace untuk disesuaikan dengan format kolom laporan Anda.
      </p>
    </div>
  )
}