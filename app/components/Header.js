'use client'

import { useState } from 'react'
import { Menu, X, DollarSign, ArrowRight, Clock } from 'lucide-react'

export default function Header({
  view = 'home',
  historyCount = 0,
  onHistoryClick,
  onOpenHistoryModal,
  onCaraKerjaClick,
  onHargaClick,
  onBackToHome,
  onLogoClick,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isHome = view === 'home'

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div className="border-b border-slate-100/80 bg-white/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onLogoClick}>
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">
                AuditToko <span className="text-slate-500">AI</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              {isHome ? (
                <>
                  <button
                    onClick={onBackToHome}
                    className="text-slate-900 font-medium transition-colors hover:text-slate-600"
                  >
                    Beranda
                  </button>
                  <button
                    onClick={onCaraKerjaClick}
                    className="text-slate-600 transition-colors hover:text-slate-900"
                  >
                    Cara Kerja
                  </button>
                  <button
                    onClick={onHargaClick}
                    className="text-slate-600 transition-colors hover:text-slate-900"
                  >
                    Harga
                  </button>
                  <button
                    onClick={onOpenHistoryModal}
                    className="flex items-center gap-1.5 text-slate-600 font-medium transition-colors hover:text-slate-900"
                  >
                    <Clock className="w-4 h-4" />
                    Riwayat <span className="bg-slate-200 text-slate-700 text-xs px-1.5 py-0.5 rounded-full">+{historyCount}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onBackToHome}
                    className="flex items-center gap-2 text-slate-900 font-medium transition-colors hover:text-slate-600"
                  >
                    <ArrowRight className="w-4 h-4" rotate="-90" />
                    Kembali ke Beranda
                  </button>
                  <button
                    onClick={onCaraKerjaClick}
                    className="text-slate-600 transition-colors hover:text-slate-900"
                  >
                    Cara Kerja
                  </button>
                  <button
                    onClick={onHargaClick}
                    className="text-slate-600 transition-colors hover:text-slate-900"
                  >
                    Harga
                  </button>
                  <button
                    onClick={onOpenHistoryModal}
                    className="flex items-center gap-1.5 text-slate-600 font-medium transition-colors hover:text-slate-900"
                  >
                    <Clock className="w-4 h-4" />
                    Riwayat <span className="bg-slate-200 text-slate-700 text-xs px-1.5 py-0.5 rounded-full">+{historyCount}</span>
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
                  onClick={onBackToHome}
                  className="block w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" rotate="-90" />
                  Kembali ke Beranda
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
  )
}
