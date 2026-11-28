/**
 * Utility penyimpanan browser menggunakan native IndexedDB.
 * Diganti localStorage agar tidak kena batas kuota 5MB
 * (cocok untuk data hasil upload file Excel/CSV yang besar).
 * Tidak perlu install library apapun — menggunakan indexedDB bawaan browser.
 *
 * Semua fungsi async dan aman untuk SSR (dicegah saat typeof window === 'undefined').
 */

const DB_NAME = 'AuditTokoDB'
const STORE_NAME = 'audit_store'
const DB_VERSION = 1

let dbPromise = null

function getDB() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('SSR: IndexedDB not available'))
  }
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })

  return dbPromise
}

/**
 * Simpan data dengan key tertentu.
 * @param {string} id - kunci penyimpanan
 * @param {any} value - data yang akan disimpan
 */
export async function idbSave(id, value) {
  if (typeof window === 'undefined') return
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const record = { id, value, updatedAt: Date.now() }
    const req = store.put(record)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/**
 * Muat data berdasarkan key.
 * @param {string} id - kunci penyimpanan
 * @returns {Promise<any|null>} data atau null jika tidak ada
 */
export async function idbLoad(id) {
  if (typeof window === 'undefined') return null
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(id)
    req.onsuccess = () => {
      const result = req.result
      resolve(result ? result.value : null)
    }
    req.onerror = () => reject(req.error)
  })
}

/**
 * Hapus data berdasarkan key.
 * @param {string} id - kunci penyimpanan
 */
export async function idbRemove(id) {
  if (typeof window === 'undefined') return
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/**
 * Hapus semua data di IndexedDB.
 */
export async function idbClearAll() {
  if (typeof window === 'undefined') return
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/**
 * Ambil semua data yang disimpan.
 * @returns {Promise<Array<{id: string, value: any}>>}
 */
export async function idbGetAll() {
  if (typeof window === 'undefined') return []
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => {
      resolve(req.result.map((r) => ({ id: r.id, ...r.value })))
    }
    req.onerror = () => reject(req.error)
  })
}

export { DB_NAME, STORE_NAME }