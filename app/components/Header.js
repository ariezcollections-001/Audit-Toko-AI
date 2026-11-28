'use client'

import { useState } from 'react'
import { Menu, X, ArrowLeft, Clock, Loader2 } from 'lucide-react'
import BrandLogo from './BrandLogo'

export default function Header({
  view = 'home',
  historyCount = 0,
  onHistoryClick,
  onOpenHistoryModal,
  onCaraKerjaClick,
  onHargaClick,
  onBackToHome,
  onLogoClick,
  adminConfig,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isBackLoading, setIsBackLoading] = useState(false)

  const handleBackToHomeClick = () => {
    setIsBackLoading(true)
    setTimeout(() => {
      setIsBackLoading(false)
      onBackToHome()
    }, 500)
  }

  const isHome = view === 'home'
  const bannerEnabled = adminConfig?.bannerEnabled === true
  const bannerType = adminConfig?.bannerType || 'text'
  const bannerText = adminConfig?.bannerText || ''
  const bannerColor = adminConfig?.bannerColor || 'blue'
  const bannerImageUrl = adminConfig?.bannerImageUrl || ''
  const bannerLink = adminConfig?.bannerLink || ''
  const bannerEffect = adminConfig?.bannerEffect || 'shimmer'
  const bannerTextMotion = adminConfig?.bannerTextMotion || 'marquee'

  const bannerBaseColor = () => {
    switch (bannerColor) {
      case 'emerald': return 'bg-emerald-600'
      case 'amber': return 'bg-amber-600'
      case 'red': return 'bg-red-600'
      case 'violet': return 'bg-violet-600'
      case 'pink': return 'bg-pink-600'
      case 'orange': return 'bg-orange-600'
      case 'cyan': return 'bg-cyan-600'
      case 'white': return 'bg-white'
      case 'black': return 'bg-black'
      default: return 'bg-blue-600'
    }
  }

  const bannerTextColor = () => {
    return bannerColor === 'white' || bannerColor === 'black'
      ? bannerColor === 'white' ? 'text-slate-900' : 'text-white'
      : 'text-white'
  }

  const bannerEffectShadow = () => {
    switch (bannerColor) {
      case 'emerald': return '0 0 25px rgba(16,185,129,0.45)'
      case 'amber': return '0 0 25px rgba(245,158,11,0.45)'
      case 'red': return '0 0 25px rgba(239,68,68,0.45)'
      case 'violet': return '0 0 25px rgba(139,92,246,0.45)'
      case 'pink': return '0 0 25px rgba(236,72,153,0.45)'
      case 'orange': return '0 0 25px rgba(234,88,12,0.45)'
      case 'cyan': return '0 0 25px rgba(6,182,212,0.45)'
      case 'white': return '0 0 25px rgba(15,23,42,0.25)'
      case 'black': return '0 0 25px rgba(255,255,255,0.35)'
      default: return '0 0 25px rgba(59,130,246,0.45)'
    }
  }

  const bannerBadge = (
    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold border border-white/40 shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ animation: 'bannerSparkleTwinkle 1.2s ease-in-out infinite alternate' }}>
      ✨ AuditToko AI
    </span>
  )

  const bannerSparkleColor = () => {
    if (bannerColor === 'white') return '#0f172a'
    if (bannerColor === 'black') return '#ffffff'
    return '#ffffff'
  }

  const bannerTextEl = (
    <div className={`w-full px-4 py-3 text-center font-medium rounded-b-xl shadow-lg ${bannerBaseColor()} ${bannerTextColor()} relative overflow-hidden`}>
      {bannerEffect === 'shimmer' && (
        <div className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/60 to-transparent z-1" style={{ animation: 'bannerShineSweep 2.2s linear infinite' }} />
      )}
      {bannerEffect === 'sparkle' && (
        <div className="absolute inset-0 pointer-events-none z-1" aria-hidden="true">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
            const sparkleColor = bannerSparkleColor()
            return (
              <span key={i} className="banner-sparkle-particle absolute" style={{
                left: `${20 + i * 11}%`,
                top: `${30 + (i % 3) * 15}%`,
                fontSize: `${10 + (i % 4)}px`,
                color: sparkleColor,
                textShadow: sparkleColor === '#ffffff' ? '0 0 6px #ffffff, 0 0 12px rgba(255,255,255,0.6)' : '0 0 6px #0f172a, 0 0 12px rgba(15,23,42,0.6)',
                animation: 'bannerSparkleTwinkle 1.2s ease-in-out infinite alternate',
                animationDelay: `${i * 0.15}s`,
              }}>★</span>
            )
          })}
        </div>
      )}
      {bannerTextMotion === 'marquee' ? (
        <div className="overflow-hidden w-full">
          <span className={`inline-block whitespace-nowrap banner-marquee-track font-extrabold tracking-wide uppercase text-sm md:text-base drop-shadow-sm ${bannerTextColor()}`} style={{ animation: 'bannerMarquee 16s linear infinite' }}>
            {bannerText}{bannerBadge}
          </span>
        </div>
      ) : (
        <span className={`font-extrabold tracking-wide uppercase text-sm md:text-base drop-shadow-sm ${bannerTextColor()} block w-full text-center px-4`}>
          {bannerText}{bannerBadge}
        </span>
      )}
    </div>
  )

  const bannerImageEl = (
    <div className="banner-image-wrap">
      {bannerEffect === 'shimmer' && (
        <div className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/60 to-transparent z-1" style={{ animation: 'bannerShineSweep 2.2s linear infinite' }} />
      )}
      {bannerEffect === 'sparkle' && (
        <div className="absolute inset-0 pointer-events-none z-1" aria-hidden="true">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <span key={i} className="banner-sparkle-particle absolute" style={{
              left: `${15 + i * 12}%`,
              top: `${20 + (i % 4) * 18}%`,
              fontSize: `${10 + (i % 4)}px`,
              color: '#ffffff',
              textShadow: '0 0 6px #ffffff, 0 0 12px rgba(255,255,255,0.6)',
              animation: 'bannerSparkleTwinkle 1.2s ease-in-out infinite alternate',
              animationDelay: `${i * 0.15}s`,
            }}>★</span>
          ))}
        </div>
      )}
      <img src={bannerImageUrl} alt="Banner Promo" className="w-full max-h-48 object-cover rounded-xl shadow-sm mx-auto" />
    </div>
  )

  return (
    <div className="sticky top-0 z-40 w-full bg-white shadow-sm">
      <header className="w-full">
      <div className="border-b border-slate-100/80 bg-white/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onLogoClick}>
              <BrandLogo className="" height={40} width={40} />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              {isHome ? (
                <>
                  <button
                    onClick={onBackToHome}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-medium text-xs md:text-sm hover:bg-slate-100 hover:border-slate-300 transition"
                  >
                    Beranda
                  </button>
                  <button
                    onClick={onCaraKerjaClick}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-medium text-xs md:text-sm hover:bg-slate-100 hover:border-slate-300 transition"
                  >
                    Cara Kerja
                  </button>
                  <button
                    onClick={onHargaClick}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-medium text-xs md:text-sm hover:bg-slate-100 hover:border-slate-300 transition"
                  >
                    Harga
                  </button>
                  <button
                    onClick={onOpenHistoryModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 text-blue-700 font-medium text-xs md:text-sm hover:bg-blue-100 transition"
                  >
                    <Clock className="w-4 h-4" />
                    Riwayat <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">+{historyCount}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleBackToHomeClick}
                    disabled={isBackLoading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-medium text-xs md:text-sm hover:bg-slate-100 hover:border-slate-300 transition disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isBackLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Kembali ke Beranda...
                      </>
                    ) : (
                      <>
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Beranda
                      </>
                    )}
                  </button>
                  <button
                    onClick={onCaraKerjaClick}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-medium text-xs md:text-sm hover:bg-slate-100 hover:border-slate-300 transition"
                  >
                    Cara Kerja
                  </button>
                  <button
                    onClick={onHargaClick}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-medium text-xs md:text-sm hover:bg-slate-100 hover:border-slate-300 transition"
                  >
                    Harga
                  </button>
                  <button
                    onClick={onOpenHistoryModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 text-blue-700 font-medium text-xs md:text-sm hover:bg-blue-100 transition"
                  >
                    <Clock className="w-4 h-4" />
                    Riwayat <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">+{historyCount}</span>
                  </button>
                </>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Buka menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 shadow-sm">
          <div className="px-4 py-6 space-y-4">
            {isHome ? (
              <>
                <button
                  onClick={onBackToHome}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Beranda
                </button>
                <button
                  onClick={onCaraKerjaClick}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Cara Kerja
                </button>
                <button
                  onClick={onHargaClick}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Harga
                </button>
                <button
                  onClick={onOpenHistoryModal}
                  className="block w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Riwayat <span className="ml-auto text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">+{historyCount}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleBackToHomeClick}
                  disabled={isBackLoading}
                  className="block w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isBackLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Kembali ke Beranda...
                    </>
                  ) : (
                    <>
                      <ArrowLeft className="w-4 h-4" />
                      Kembali ke Beranda
                    </>
                  )}
                </button>
                <button
                  onClick={onCaraKerjaClick}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Cara Kerja
                </button>
                <button
                  onClick={onHargaClick}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Harga
                </button>
                <button
                  onClick={onOpenHistoryModal}
                  className="block w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Riwayat <span className="ml-auto text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">+{historyCount}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>

      {/* Banner Promo — baris 2, tepat di bawah navigasi */}
      {bannerEnabled && (
        <div style={{ width: '100%' }}>
          <div
            className={`${
              bannerType === 'image' && bannerImageUrl
                ? 'px-4 pt-3 pb-1'
                : 'px-4 py-3'
            } relative overflow-hidden`}
            style={{
              boxShadow:
                bannerEffect === 'neon' ? bannerEffectShadow() : undefined,
              animation:
                bannerEffect === 'neon' ? 'bannerNeonPulse 1.4s ease-in-out infinite alternate'
                : bannerEffect === 'ombak' ? 'bannerWave 3s ease-in-out infinite'
                : bannerEffect === 'lembut' ? 'bannerFade 2s ease-in-out infinite alternate'
                : bannerEffect === 'rgb' ? 'bannerRgbGlow 2s linear infinite'
                : undefined,
            }}
          >
            {bannerType === 'text' && bannerText ? (
              bannerLink ? (
                <a href={bannerLink} target="_blank" rel="noopener noreferrer" className="block">
                  {bannerTextEl}
                </a>
              ) : (
                bannerTextEl
              )
            ) : null}
            {/* Image mode */}
            {bannerType === 'image' && bannerImageUrl ? (
              bannerLink ? (
                <a href={bannerLink} target="_blank" rel="noopener noreferrer" className="block">
                  {bannerImageEl}
                </a>
              ) : (
                bannerImageEl
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
