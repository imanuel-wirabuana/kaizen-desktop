import type { StateStorage } from 'zustand/middleware'

const DB_NAME = 'kaizen_folders_db'
const DB_VERSION = 1
const STORE_NAME = 'board_folders_store'

let dbInstancePromise: Promise<IDBDatabase> | null = null

/**
 * Open or retrieve the cached IndexedDB database instance.
 */
function getDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'))
  }

  if (dbInstancePromise) {
    return dbInstancePromise
  }

  dbInstancePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => {
      const db = request.result

      db.onversionchange = () => {
        db.close()
        dbInstancePromise = null
      }

      db.onclose = () => {
        dbInstancePromise = null
      }

      resolve(db)
    }

    request.onerror = () => {
      dbInstancePromise = null
      reject(request.error || new Error('Failed to open IndexedDB'))
    }

    request.onblocked = () => {
      console.warn('[Folders DB] Database open blocked: another connection is open with an older version')
    }
  })

  return dbInstancePromise
}

/**
 * Low-level IndexedDB get operation
 */
export async function idbGet(key: string): Promise<string | null> {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(key)

    request.onsuccess = () => {
      resolve(request.result !== undefined ? (request.result as string) : null)
    }

    request.onerror = () => {
      reject(request.error || new Error(`Failed to get key ${key} from IndexedDB`))
    }
  })
}

/**
 * Low-level IndexedDB put/set operation
 */
export async function idbSet(key: string, value: string): Promise<void> {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(value, key)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(request.error || new Error(`Failed to set key ${key} into IndexedDB`))
    }

    transaction.onabort = () => {
      reject(transaction.error || new Error('Transaction aborted'))
    }
  })
}

/**
 * Low-level IndexedDB delete operation
 */
export async function idbDelete(key: string): Promise<void> {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(key)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(request.error || new Error(`Failed to remove key ${key} from IndexedDB`))
    }

    transaction.onabort = () => {
      reject(transaction.error || new Error('Transaction aborted'))
    }
  })
}

/**
 * Zustand StateStorage adapter backed by IndexedDB for board folders.
 */
export const boardFoldersIndexedDbStorage: StateStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const val = await idbGet(key)
      if (val !== null) {
        return val
      }
    } catch (err) {
      console.warn('[Folders DB] Failed to read from IndexedDB, attempting fallback:', err)
    }

    // Fallback to localStorage if IndexedDB is empty or errors
    try {
      const localVal = localStorage.getItem(key)
      if (localVal) {
        // Asynchronously backfill IndexedDB
        idbSet(key, localVal).catch((e) =>
          console.warn('[Folders DB] Failed to backfill localStorage value to IndexedDB:', e)
        )
        return localVal
      }
    } catch (e) {
      console.warn('[Folders DB] localStorage fallback get failed:', e)
    }

    return null
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await idbSet(key, value)
      // Mirror to localStorage as backup
      try {
        localStorage.setItem(key, value)
      } catch {
        // Ignore quota errors on localStorage
      }
    } catch (err) {
      console.error('[Folders DB] Failed to write to IndexedDB, falling back to localStorage:', err)
      try {
        localStorage.setItem(key, value)
      } catch (e) {
        console.error('[Folders DB] Both IndexedDB and localStorage write failed:', e)
      }
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await idbDelete(key)
      try {
        localStorage.removeItem(key)
      } catch {
        // Ignore
      }
    } catch (err) {
      console.error('[Folders DB] Failed to delete from IndexedDB:', err)
      try {
        localStorage.removeItem(key)
      } catch {
        // Ignore
      }
    }
  }
}
