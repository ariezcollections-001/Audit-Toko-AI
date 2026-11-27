import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { limiters } from '../../lib/rateLimit'

const DATA_DIR = path.join(process.cwd(), 'data')
const TICKETS_FILE = path.join(DATA_DIR, 'support_tickets.json')

export async function POST(req) {
  try {
    // Rate limit: maksimal 15 permintaan per menit per IP
    const limit = limiters.supportTicket(req)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan dukungan. Silakan coba lagi nanti.' },
        { status: 429 }
      )
    }

    const { contact, message } = await req.json()

    if (!contact || !contact.trim() || !message || !message.trim()) {
      return NextResponse.json({ error: 'Contact dan message diperlukan' }, { status: 400 })
    }

    // Batasi teks keluhan maksimal 1.000 karakter
    if (message.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Pesan keluhan maksimal 1.000 karakter.' },
        { status: 400 }
      )
    }

    // Pastikan folder data/ ada
    try {
      await fs.mkdir(DATA_DIR, { recursive: true })
    } catch {}

    // Baca tiket yang sudah ada
    let tickets = []
    try {
      const raw = await fs.readFile(TICKETS_FILE, 'utf-8')
      tickets = JSON.parse(raw)
      if (!Array.isArray(tickets)) tickets = []
    } catch {
      tickets = []
    }

    const ticket = {
      id: Date.now().toString(),
      contact: contact.trim(),
      message: message.trim(),
      status: 'unread',
      createdAt: new Date().toISOString(),
    }

    tickets.push(ticket)
    await fs.writeFile(TICKETS_FILE, JSON.stringify(tickets, null, 2))

    return NextResponse.json({ success: true, ticket })
  } catch (err) {
    console.error('Support API error:', err)
    return NextResponse.json({ error: 'Gagal menyimpan tiket dukungan' }, { status: 500 })
  }
}