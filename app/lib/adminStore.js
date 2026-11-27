import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const STORE_FILE = path.join(DATA_DIR, 'admin_store.json')

const DEFAULT_CONFIG = {
  brandName: 'AuditToko AI',
  brandLogoUrl: '',
  auditPrice: 15000,
  adminPassword: process.env.ADMIN_PASSWORD || 'admin12345',
  maintenanceMode: false,
  bannerEnabled: false,
  bannerType: 'text',
  bannerText: '',
  bannerColor: 'blue',
  bannerImageUrl: '',
  bannerLink: '',
  aiChatEnabled: true,
  aiCustomKnowledge: '',
}

const DEFAULT_STORE = {
  config: { ...DEFAULT_CONFIG },
  vouchers: { masterCode: 'ADMIN-MASTER-2026', oneTimeCodes: [] },
  analytics: { visits: [], uploads: [], unlocks: [] },
  transactions: [],
  supportTickets: [],
  unrecognizedColumns: [],
}

function hasUpstash() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

async function upstashRequest(apiPath, { method = 'GET', body } = {}) {
  const url = `${process.env.UPSTASH_REDIS_REST_URL}${apiPath}`
  const headers = {
    Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
    'Content-Type': 'application/json',
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`)
  return res.json()
}

async function upstashGet(key) {
  const data = await upstashRequest(`/get/${key}`)
  return data.result
}

async function upstashSet(key, value) {
  await upstashRequest(`/set/${key}`, { method: 'POST', body: { value } })
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {}
}

async function readLocalStore() {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return parsed
  } catch {
    return { ...DEFAULT_STORE }
  }
}

async function writeLocalStore(store) {
  await ensureDataDir()
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2))
}

export class AdminStore {
  constructor() {
    this.useRedis = hasUpstash()
    this.localCache = null
    this.localCacheTime = 0
    this.CACHE_TTL_MS = 5000
  }

  async _getStore() {
    if (this.useRedis) {
      try {
        const raw = await upstashGet('admin_store')
        if (raw) return JSON.parse(raw)
        return { ...DEFAULT_STORE }
      } catch (err) {
        console.error('Upstash read failed, local fallback:', err)
        this.useRedis = false
      }
    }
    const now = Date.now()
    if (this.localCache && now - this.localCacheTime < this.CACHE_TTL_MS) {
      return this.localCache
    }
    const store = await readLocalStore()
    this.localCache = store
    this.localCacheTime = now
    return store
  }

  async _setStore(store) {
    if (this.useRedis) {
      try {
        await upstashSet('admin_store', JSON.stringify(store))
        return
      } catch (err) {
        console.error('Upstash write failed, local fallback:', err)
        this.useRedis = false
      }
    }
    await writeLocalStore(store)
    this.localCache = store
    this.localCacheTime = Date.now()
  }

  /* ====================== CONFIG ====================== */
  async getConfig() {
    const store = await this._getStore()
    return store.config
  }

  async updateConfig(updates) {
    const store = await this._getStore()
    store.config = { ...store.config, ...updates }
    await this._setStore(store)
    return store.config
  }

  /* ====================== VOUCHERS ====================== */
  async getVouchers() {
    const store = await this._getStore()
    return store.vouchers
  }

  async updateVouchers(updates) {
    const store = await this._getStore()
    store.vouchers = { ...store.vouchers, ...updates }
    await this._setStore(store)
    return store.vouchers
  }

  async consumeOneTimeCode(code) {
    const store = await this._getStore()
    const idx = store.vouchers.oneTimeCodes.indexOf(code)
    if (idx >= 0) {
      store.vouchers.oneTimeCodes.splice(idx, 1)
      await this._setStore(store)
      return true
    }
    return false
  }

  async addOneTimeCode(code) {
    const store = await this._getStore()
    if (!store.vouchers.oneTimeCodes.includes(code)) {
      store.vouchers.oneTimeCodes.push(code)
      await this._setStore(store)
    }
    return store.vouchers
  }

  async removeOneTimeCode(code) {
    const store = await this._getStore()
    store.vouchers.oneTimeCodes = store.vouchers.oneTimeCodes.filter((c) => c !== code)
    await this._setStore(store)
    return store.vouchers
  }

  /* ====================== ANALYTICS ====================== */
  async getAnalytics() {
    const store = await this._getStore()
    return store.analytics
  }

  async recordEvent(type, payload = {}) {
    const store = await this._getStore()
    const date = new Date().toISOString().slice(0, 10)
    const entry = { ...payload, date, timestamp: new Date().toISOString() }

    if (type === 'visits') store.analytics.visits.push(entry)
    else if (type === 'uploads') store.analytics.uploads.push(entry)
    else if (type === 'unlocks') store.analytics.unlocks.push(entry)

    const MAX = 1000
    if (store.analytics.visits.length > MAX)
      store.analytics.visits = store.analytics.visits.slice(-MAX)
    if (store.analytics.uploads.length > MAX)
      store.analytics.uploads = store.analytics.uploads.slice(-MAX)
    if (store.analytics.unlocks.length > MAX)
      store.analytics.unlocks = store.analytics.unlocks.slice(-MAX)

    await this._setStore(store)
    return entry
  }

  /* ====================== TRANSACTIONS ====================== */
  async getTransactions() {
    const store = await this._getStore()
    return store.transactions
  }

  async addTransaction(tx) {
    const store = await this._getStore()
    store.transactions.push({
      id: Date.now().toString(),
      ...tx,
      date: new Date().toISOString().slice(0, 10),
    })
    await this._setStore(store)
    return store.transactions
  }

  /* ====================== SUPPORT TICKETS ====================== */
  async getSupportTickets() {
    const store = await this._getStore()
    return store.supportTickets
  }

  async addSupportTicket(ticket) {
    const store = await this._getStore()
    store.supportTickets.push({
      id: Date.now().toString(),
      status: 'unread',
      createdAt: new Date().toISOString(),
      ...ticket,
    })
    await this._setStore(store)
    return store.supportTickets
  }

  async updateSupportTicket(id, updates) {
    const store = await this._getStore()
    const idx = store.supportTickets.findIndex((t) => t.id === id)
    if (idx >= 0) {
      store.supportTickets[idx] = { ...store.supportTickets[idx], ...updates }
      await this._setStore(store)
    }
    return store.supportTickets
  }

  async deleteSupportTicket(id) {
    const store = await this._getStore()
    store.supportTickets = store.supportTickets.filter((t) => t.id !== id)
    await this._setStore(store)
    return store.supportTickets
  }

  /* ====================== UNRECOGNIZED COLUMNS ====================== */
  async getUnrecognizedColumns() {
    const store = await this._getStore()
    return store.unrecognizedColumns
  }

  async addUnrecognizedColumn(headers) {
    const store = await this._getStore()
    store.unrecognizedColumns.push({
      id: Date.now().toString(),
      date: new Date().toISOString().slice(0, 10),
      headers,
    })
    if (store.unrecognizedColumns.length > 200)
      store.unrecognizedColumns = store.unrecognizedColumns.slice(-200)
    await this._setStore(store)
    return store.unrecognizedColumns
  }

  /* ====================== FULL STORE ====================== */
  async getFullStore() {
    return this._getStore()
  }

  async resetAnalytics() {
    const store = await this._getStore()
    store.analytics = { visits: [], uploads: [], unlocks: [] }
    await this._setStore(store)
    return store.analytics
  }

  async resetStore() {
    await this._setStore({ ...DEFAULT_STORE })
    return DEFAULT_STORE
  }
}

export const adminStore = new AdminStore()
export default adminStore