'use client'

import { useState, useEffect } from 'react'
import { DollarSign } from 'lucide-react'

export default function BrandLogo({ className = '', height = 32, width = 32 }) {
  const [brand, setBrand] = useState({ brandName: 'AuditToko AI', brandLogoUrl: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin?action=config&public=1', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setBrand({
            brandName: data.brandName || 'AuditToko AI',
            brandLogoUrl: data.brandLogoUrl || '',
          })
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const hasLogo = Boolean(brand.brandLogoUrl && !loading)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {hasLogo && brand.brandLogoUrl ? (
        <img
          src={brand.brandLogoUrl}
          alt={brand.brandName}
          width={width}
          height={height}
          className="rounded-xl object-contain border border-slate-200 bg-white shadow-sm"
          loading="eager"
        />
      ) : (
        <div
          className={`w-${Math.floor(width / 8)} h-${Math.floor(height / 8)} rounded-xl bg-slate-900 flex items-center justify-center shadow-sm border border-slate-700`}
          title={brand.brandName}
        >
          <DollarSign className={`w-${Math.floor(width / 4)} h-${Math.floor(height / 4)} text-white`} />
        </div>
      )}
      <span
        className="font-bold text-slate-900 tracking-tight text-base select-none truncate max-w-xs"
        title={brand.brandName}
      >
        {brand.brandName}
      </span>
    </div>
  )
}