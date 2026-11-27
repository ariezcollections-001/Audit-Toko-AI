/* ============================================================================
   RATE LIMITER / ANTI BRUTE-FORCE (in-memory, siap produksi)
   Ganti storage dengan Redis untuk clustering multi-instance.
   ============================================================================ */

// Map: clientKey -> array of timestamps (ms)
const rateLimitMap = new Map()

/** Ambil identifikasi klien dari IP (mengindori proxy forwarding) */
function getClientKey(req) {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}

/**
 * Buat rate limiter dengan jendela waktu.
 * @param {number} maxRequests  Maksimal permintaan per window
 * @param {number} windowMs     Ukuran jendela dalam milidetik
 * @returns {(req: Request) => {allowed: boolean, remaining: number, resetTime: number}}
 */
function createRateLimiter(maxRequests, windowMs) {
  return function rateLimiter(req) {
    const key = getClientKey(req)
    const now = Date.now()

    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, [])
    }
    const timestamps = rateLimitMap.get(key)

    // Buang stempel di luar jendela waktu
    const valid = timestamps.filter(t => now - t < windowMs)

    if (valid.length >= maxRequests) {
      const resetTime = Math.max(...valid) + windowMs
      return { allowed: false, remaining: 0, resetTime }
    }

    valid.push(now)
    rateLimitMap.set(key, valid)

    return { allowed: true, remaining: Math.max(0, maxRequests - valid.length), resetTime: now + windowMs }
  }
}

/** Kumpulan limiter untuk setiap endpoint */
export const limiters = {
  // Login admin: maksimal 5 gagal per 15 menit per IP
  adminLogin: createRateLimiter(5, 15 * 60 * 1000),

  // Redeem voucher: maksimal 10 percobaan per menit per IP
  voucherRedeem: createRateLimiter(10, 60 * 1000),

  // Asisten AI & tiket dukungan: maksimal 15 permintaan per menit per IP
  aiChat: createRateLimiter(15, 60 * 1000),
  supportTicket: createRateLimiter(15, 60 * 1000),
}

export { rateLimitMap, createRateLimiter, getClientKey }