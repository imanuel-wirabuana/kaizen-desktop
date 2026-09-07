import type { StateStorage } from 'zustand/middleware'

const DB_NAME = 'kaizen_ai_db'
const DB_VERSION = 1
const STORE_NAME = 'ai_chats'

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
      console.warn('[AI Chat DB] Database open blocked: another connection is open with an older version')
    }
  })

  return dbInstancePromise
}

/**
 * Low-level IndexedDB get operation
 */
async function idbGet(key: string): Promise<string | null> {
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
async function idbSet(key: string, value: string): Promise<void> {
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
async function idbRemove(key: string): Promise<void> {
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
  })
}

/**
 * Zustand StateStorage adapter backed by IndexedDB.
 * Features automatic one-time migration from localStorage on first read
 * and safe fallback if IndexedDB is unavailable.
 */
export const aiChatIndexedDbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await idbGet(name)
      if (value !== null) {
        return value
      }
    } catch (err) {
      console.warn('[AI Chat DB] Failed to read from IndexedDB, attempting fallback:', err)
    }

    // One-time automatic migration from localStorage if not present in IndexedDB
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const localValue =
          localStorage.getItem(name) ||
          (name === 'kaizen_board_ai_chats'
            ? localStorage.getItem('kaizen-board-ai-chats')
            : null)

        if (localValue) {
          try {
            // Verify it's valid JSON before saving to IndexedDB
            JSON.parse(localValue)
            await idbSet(name, localValue)
            // Reclaim localStorage quota
            localStorage.removeItem(name)
            localStorage.removeItem('kaizen-board-ai-chats')
            console.log('[AI Chat DB] Successfully migrated chat history from localStorage to IndexedDB')
            return localValue
          } catch {
            console.warn('[AI Chat DB] Found corrupted chat data in localStorage, skipping migration')
          }
        }
      } catch (storageErr) {
        console.warn('[AI Chat DB] LocalStorage migration check failed:', storageErr)
      }
    }

    return null
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await idbSet(name, value)
    } catch (err) {
      console.error('[AI Chat DB] Failed to write to IndexedDB, falling back to localStorage:', err)
      // Fallback to localStorage in case IndexedDB failed
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(name, value)
        } catch (e) {
          console.error('[AI Chat DB] LocalStorage fallback also failed:', e)
        }
      }
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await idbRemove(name)
    } catch (err) {
      console.error('[AI Chat DB] Failed to delete from IndexedDB:', err)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(name)
      }
    }
  }
}

/**
 * Utility function to clear all AI chat history from IndexedDB.
 */
export async function clearAllAiChatsFromDb(): Promise<void> {
  try {
    const db = await getDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error('[AI Chat DB] Failed to clear AI chats store:', err)
  }
}
