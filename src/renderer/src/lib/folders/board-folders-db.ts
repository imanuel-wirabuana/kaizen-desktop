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
 * Features automatic one-time migration from localStorage on first read
 * and safe fallback only if IndexedDB is unavailable.
 *
 * Persists serialized JSON containing:
 * - state.folders: Array<BoardFolder> with { id, user_id, name, icon, color, order, isCollapsed, createdAt, updatedAt }
 * - state.boardFolderMap: Record<boardId, folderId>
 * - state.boardOrderMap: Record<categoryKey, boardIds>
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

    // One-time automatic migration from localStorage if not present in IndexedDB
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const legacyKeys = [key, 'kaizen_board_folders_v1', 'kaizen-board-folders', 'board_folders']
        for (const k of legacyKeys) {
          const localVal = localStorage.getItem(k)
          if (localVal) {
            try {
              // Verify it's valid JSON before saving to IndexedDB
              JSON.parse(localVal)
              await idbSet(key, localVal)
              // Reclaim localStorage quota and remove localStorage copy
              localStorage.removeItem(k)
              console.log(
                `[Folders DB] Successfully migrated folders from localStorage key "${k}" to IndexedDB key "${key}"`
              )
              return localVal
            } catch {
              console.warn(`[Folders DB] Found corrupt folder data in localStorage key "${k}", skipping migration`)
            }
          }
        }
      } catch (e) {
        console.warn('[Folders DB] LocalStorage migration check failed:', e)
      }
    }

    return null
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await idbSet(key, value)
    } catch (err) {
      console.error('[Folders DB] Failed to write to IndexedDB, falling back to localStorage:', err)
      // Fallback only if IndexedDB write fails
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(key, value)
        } catch (e) {
          console.error('[Folders DB] LocalStorage fallback also failed:', e)
        }
      }
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await idbDelete(key)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key)
        localStorage.removeItem('kaizen_board_folders_v1')
      }
    } catch (err) {
      console.error('[Folders DB] Failed to delete from IndexedDB:', err)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key)
      }
    }
  }
}

/**
 * Proactively migrates any remaining folders data in localStorage into IndexedDB and cleans up localStorage.
 */
export async function migrateFoldersFromLocalStorageToDb(
  targetKey = 'kaizen_board_folders_v1'
): Promise<boolean> {
  if (typeof window === 'undefined' || !window.localStorage) return false

  const legacyKeys = [targetKey, 'kaizen-board-folders', 'board_folders']
  let migrated = false

  for (const k of legacyKeys) {
    const raw = localStorage.getItem(k)
    if (raw) {
      try {
        JSON.parse(raw)
        const existing = await idbGet(targetKey)
        if (!existing) {
          await idbSet(targetKey, raw)
          console.log(`[Folders DB] Proactively migrated key "${k}" to IndexedDB key "${targetKey}"`)
        }
        localStorage.removeItem(k)
        migrated = true
      } catch (e) {
        console.warn(`[Folders DB] Failed to migrate localStorage key "${k}":`, e)
      }
    }
  }

  return migrated
}

/**
 * Utility function to read stored folders state directly from IndexedDB.
 */
export async function getStoredFoldersFromDb(key = 'kaizen_board_folders_v1'): Promise<any | null> {
  try {
    const raw = await idbGet(key)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.error('[Folders DB] Failed to read stored folders from IndexedDB:', err)
    return null
  }
}

/**
 * Utility function to save raw folders state directly into IndexedDB.
 */
export async function saveFoldersToDb(
  stateData: {
    folders: any[]
    boardFolderMap: Record<string, string>
    boardOrderMap: Record<string, (string | number)[]>
  },
  key = 'kaizen_board_folders_v1'
): Promise<void> {
  const payload = JSON.stringify({ state: stateData, version: 1 })
  await idbSet(key, payload)
}

/**
 * Utility function to clear all board folders from IndexedDB.
 */
export async function clearAllBoardFoldersFromDb(): Promise<void> {
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
    console.error('[Folders DB] Failed to clear board folders store:', err)
  }
}

