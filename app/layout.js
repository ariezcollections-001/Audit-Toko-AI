import './globals.css'
import AiChatWidget from './components/AiChatWidget'

export const metadata = {
  title: 'AuditToko AI - Analisis Profit Shopee Terbaik',
  description: 'Platform otomatis untuk audit laporan penjualan, deteksi produk rugi, dan rekomendasi harga jual baru bagi penjual marketplace.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
        <AiChatWidget />
      </body>
    </html>
  )
}
